"use client";

import { type Comment, type SafeUser, UserRole } from "@taskflow/shared";

import { Button } from "@/components/ui/Button";
import {
  formatTaskDateTime,
  formatUserReference,
} from "@/components/tasks/task-formatting";

type CommentItemProps = {
  comment: Comment;
  currentUser: SafeUser;
  isDeleting?: boolean;
  onDelete: (comment: Comment) => void;
};

export function CommentItem({
  comment,
  currentUser,
  isDeleting = false,
  onDelete,
}: CommentItemProps) {
  const canDelete =
    currentUser.role === UserRole.Admin || comment.authorId === currentUser.id;

  return (
    <article className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p
            className="break-words text-sm font-semibold text-ink"
            title={comment.authorId}
          >
            {formatUserReference(comment.authorId, currentUser)}
          </p>
          <time
            className="mt-1 block text-xs font-medium text-ink/45"
            dateTime={comment.createdAt}
          >
            {formatTaskDateTime(comment.createdAt)}
          </time>
        </div>

        {canDelete ? (
          <Button
            isLoading={isDeleting}
            loadingLabel="Deleting..."
            onClick={() => onDelete(comment)}
            size="sm"
            type="button"
            variant="danger"
          >
            Delete
          </Button>
        ) : null}
      </div>

      <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-ink/70">
        {comment.content}
      </p>
    </article>
  );
}
