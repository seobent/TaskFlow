"use client";

import {
  type Attachment,
  type Comment,
  type CreateCommentInput,
  type SafeUser,
  type Task,
} from "@taskflow/shared";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { CommentForm } from "@/components/tasks/CommentForm";
import { CommentList } from "@/components/tasks/CommentList";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { TaskAttachments } from "@/components/tasks/TaskAttachments";
import {
  formatTaskDateTime,
  formatUserReference,
} from "@/components/tasks/task-formatting";
import { Button } from "@/components/ui/Button";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type TaskDetailsProps = {
  currentUser: SafeUser;
  taskId: string;
};

export function TaskDetails({ currentUser, taskId }: TaskDetailsProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [attachmentFormError, setAttachmentFormError] = useState<string | null>(
    null,
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [commentFormError, setCommentFormError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTaskDetails() {
      setActionError(null);
      setAttachmentFormError(null);
      setCommentFormError(null);
      setIsLoading(true);
      setLoadError(null);

      try {
        const [taskResponse, commentsResponse, attachmentsResponse] =
          await Promise.all([
            fetch(`/api/tasks/${taskId}`, {
              credentials: "include",
              signal: controller.signal,
            }),
            fetch(`/api/tasks/${taskId}/comments`, {
              credentials: "include",
              signal: controller.signal,
            }),
            fetch(`/api/tasks/${taskId}/attachments`, {
              credentials: "include",
              signal: controller.signal,
            }),
          ]);
        const [taskBody, commentsBody, attachmentsBody] = await Promise.all([
          readResponseJson(taskResponse),
          readResponseJson(commentsResponse),
          readResponseJson(attachmentsResponse),
        ]);

        if (
          taskResponse.status === 401 ||
          commentsResponse.status === 401 ||
          attachmentsResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (!taskResponse.ok) {
          setLoadError(readApiErrorMessage(taskBody, "Unable to load task."));
          return;
        }

        if (!commentsResponse.ok) {
          setLoadError(
            readApiErrorMessage(commentsBody, "Unable to load comments."),
          );
          return;
        }

        if (!attachmentsResponse.ok) {
          setLoadError(
            readApiErrorMessage(
              attachmentsBody,
              "Unable to load attachments.",
            ),
          );
          return;
        }

        const taskPayload = readApiData<{ task: Task }>(taskBody);
        const commentsPayload =
          readApiData<{ comments: Comment[] }>(commentsBody);
        const attachmentsPayload =
          readApiData<{ attachments: Attachment[] }>(attachmentsBody);

        if (!taskPayload?.task) {
          setLoadError("This task could not be found.");
          return;
        }

        setTask(taskPayload.task);
        setComments(sortComments(commentsPayload?.comments ?? []));
        setAttachments(sortAttachments(attachmentsPayload?.attachments ?? []));
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Unable to reach TaskFlow. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTaskDetails();

    return () => {
      controller.abort();
    };
  }, [reloadToken, router, taskId]);

  async function handleUploadAttachment(file: File) {
    setActionError(null);
    setAttachmentFormError(null);
    setCommentFormError(null);
    setIsUploadingAttachment(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        body: formData,
        credentials: "include",
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return false;
      }

      if (!response.ok) {
        setAttachmentFormError(
          readApiErrorMessage(body, "Unable to upload attachment."),
        );
        return false;
      }

      const payload = readApiData<{ attachment: Attachment }>(body);

      if (!payload?.attachment) {
        setAttachmentFormError("Attachment could not be saved.");
        return false;
      }

      setAttachments((currentAttachments) =>
        sortAttachments([...currentAttachments, payload.attachment]),
      );
      return true;
    } catch {
      setAttachmentFormError("Unable to reach TaskFlow. Please try again.");
      return false;
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  async function handleCreateComment(values: CreateCommentInput) {
    setActionError(null);
    setAttachmentFormError(null);
    setCommentFormError(null);
    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        body: JSON.stringify(values),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return false;
      }

      if (!response.ok) {
        setCommentFormError(
          readApiErrorMessage(body, "Unable to add comment."),
        );
        return false;
      }

      const payload = readApiData<{ comment: Comment }>(body);

      if (!payload?.comment) {
        setCommentFormError("Comment could not be saved.");
        return false;
      }

      setComments((currentComments) =>
        sortComments([...currentComments, payload.comment]),
      );
      return true;
    } catch {
      setCommentFormError("Unable to reach TaskFlow. Please try again.");
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(comment: Comment) {
    setActionError(null);
    setAttachmentFormError(null);
    setCommentFormError(null);
    setDeletingCommentId(comment.id);

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        credentials: "include",
        method: "DELETE",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setActionError(readApiErrorMessage(body, "Unable to delete comment."));
        return;
      }

      setComments((currentComments) =>
        currentComments.filter(
          (currentComment) => currentComment.id !== comment.id,
        ),
      );
    } catch {
      setActionError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-72 items-center justify-center text-ink/65"
        role="status"
      >
        <span
          aria-hidden="true"
          className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-mint border-r-transparent"
        />
        <span className="text-sm font-semibold">Loading task details...</span>
      </div>
    );
  }

  if (loadError || !task) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 bg-surface p-6 text-center">
        <h3 className="text-base font-semibold text-ink">
          Task details could not be loaded
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
          {loadError ?? "This task could not be found."}
        </p>
        <Button
          className="mt-4"
          onClick={() => setReloadToken((token) => token + 1)}
          type="button"
          variant="secondary"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-ink/10 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wider text-mint">
              Task details
            </p>
            <h2 className="mt-2 break-words text-2xl font-semibold text-ink">
              {task.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
      </header>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/55">
          Description
        </h3>
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-ink/70">
          {task.description || "No description has been added yet."}
        </p>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2">
        <TaskDetailField label="Status">
          <StatusBadge status={task.status} />
        </TaskDetailField>
        <TaskDetailField label="Priority">
          <PriorityBadge priority={task.priority} />
        </TaskDetailField>
        <TaskDetailField label="Due date">
          {task.dueDate ? formatTaskDateTime(task.dueDate) : "No due date"}
        </TaskDetailField>
        <TaskDetailField label="Assignee">
          <span title={task.assigneeId ?? undefined}>
            {formatUserReference(task.assigneeId, currentUser)}
          </span>
        </TaskDetailField>
        <TaskDetailField label="Creator">
          <span title={task.createdById}>
            {formatUserReference(task.createdById, currentUser)}
          </span>
        </TaskDetailField>
        <TaskDetailField label="Created">
          {formatTaskDateTime(task.createdAt)}
        </TaskDetailField>
      </dl>

      <TaskAttachments
        attachments={attachments}
        error={attachmentFormError}
        isUploading={isUploadingAttachment}
        onUpload={handleUploadAttachment}
      />

      <section className="space-y-4 border-t border-ink/10 pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-mint">
              Comments
            </p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              Discussion
            </h3>
          </div>
          <span className="rounded bg-surface px-2 py-1 text-xs font-semibold text-ink/55">
            {comments.length}
          </span>
        </div>

        {actionError ? (
          <div
            className="rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        <CommentList
          comments={comments}
          currentUser={currentUser}
          deletingCommentId={deletingCommentId}
          onDeleteComment={handleDeleteComment}
        />

        <CommentForm
          error={commentFormError}
          isSubmitting={isSubmittingComment}
          onSubmit={handleCreateComment}
        />
      </section>
    </div>
  );
}

function TaskDetailField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-md bg-surface px-3 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">
        {children}
      </dd>
    </div>
  );
}

function sortComments(comments: Comment[]) {
  return [...comments].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() -
      new Date(second.createdAt).getTime(),
  );
}

function sortAttachments(attachments: Attachment[]) {
  return [...attachments].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );
}
