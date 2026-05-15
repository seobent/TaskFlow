"use client";

import {
  type CreateTaskInput,
  type SafeUser,
  type Task,
  TaskPriority,
  TaskStatus,
  type UpdateTaskInput,
  UserRole,
} from "@taskflow/shared";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

import { StatusColumn } from "@/components/tasks/StatusColumn";
import { TaskDragPreview } from "@/components/tasks/TaskCard";
import { TaskDetails } from "@/components/tasks/TaskDetails";
import { TaskForm, type TaskFormValues } from "@/components/tasks/TaskForm";
import type { UserNameLookup } from "@/components/tasks/task-formatting";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type TaskBoardProps = {
  currentUser: SafeUser;
  projectId: string;
};

type ProjectTasksPayload = {
  permissions?: TaskBoardPermissions;
  tasks: Task[];
  users?: SafeUser[];
};

type TaskBoardPermissions = {
  canCreate: boolean;
  canDelete: boolean;
  canUpdate: boolean;
};

const taskColumns = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Done,
];

export function TaskBoard({ currentUser, projectId }: TaskBoardProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>(
    TaskStatus.Todo,
  );
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [statusTaskId, setStatusTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersById, setUsersById] = useState<UserNameLookup>(() =>
    buildUserNameLookup(currentUser),
  );
  const [permissions, setPermissions] = useState<TaskBoardPermissions>({
    canCreate: false,
    canDelete: false,
    canUpdate: false,
  });
  const canCreateTasks = permissions.canCreate;
  const canDeleteTasks = permissions.canDelete;
  const canUpdateTasks = permissions.canUpdate;

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      setActionError(null);
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
          credentials: "include",
          signal: controller.signal,
        });
        const body = await readResponseJson(response);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setLoadError(readApiErrorMessage(body, "Unable to load tasks."));
          return;
        }

        const payload = readApiData<ProjectTasksPayload>(body);
        setPermissions(
          payload?.permissions ?? {
            canCreate:
              currentUser.role === UserRole.Admin ||
              currentUser.role === UserRole.Manager,
            canDelete: currentUser.role === UserRole.Admin,
            canUpdate: currentUser.role === UserRole.Admin,
          },
        );
        setUsersById(buildUserNameLookup(currentUser, payload?.users));
        setTasks(sortTasks(Array.isArray(payload?.tasks) ? payload.tasks : []));
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

    loadTasks();

    return () => {
      controller.abort();
    };
  }, [currentUser, projectId, reloadToken, router]);

  const groupedTasks = useMemo(
    () =>
      taskColumns.map((status) => ({
        status,
        tasks: tasks.filter((task) => task.status === status),
      })),
    [tasks],
  );

  const editTaskInitialValues = useMemo(
    () => (editingTask ? taskToFormValues(editingTask) : undefined),
    [editingTask],
  );

  const draggedTask = useMemo(
    () => tasks.find((task) => task.id === draggedTaskId) ?? null,
    [draggedTaskId, tasks],
  );

  useEffect(() => {
    if (!draggedTaskId) {
      return;
    }

    function handleDragOver(event: DragEvent) {
      if (event.clientX || event.clientY) {
        setDragPreviewPosition({ x: event.clientX, y: event.clientY });
        return;
      }

      if (event.pageX || event.pageY) {
        setDragPreviewPosition({
          x: event.pageX - window.scrollX,
          y: event.pageY - window.scrollY,
        });
      }
    }

    window.addEventListener("dragover", handleDragOver);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
    };
  }, [draggedTaskId]);

  const createTaskInitialValues = useMemo(
    () => ({
      priority: TaskPriority.Medium,
      status: createTaskStatus,
    }),
    [createTaskStatus],
  );

  async function handleCreateTask(values: TaskFormValues) {
    if (!canCreateTasks) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        body: JSON.stringify(buildTaskInput(values)),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setFormError(readApiErrorMessage(body, "Unable to create task."));
        return;
      }

      const payload = readApiData<{ task: Task }>(body);

      if (payload?.task) {
        setTasks((currentTasks) => sortTasks([payload.task, ...currentTasks]));
      }

      setIsCreateModalOpen(false);
      router.refresh();
    } catch {
      setFormError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateTask(values: TaskFormValues) {
    if (!editingTask || !canUpdateTasks) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        body: JSON.stringify(buildTaskInput(values)),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setFormError(readApiErrorMessage(body, "Unable to update task."));
        return;
      }

      const payload = readApiData<{ task: Task }>(body);

      if (payload?.task) {
        setTasks((currentTasks) =>
          sortTasks(
            currentTasks.map((task) =>
              task.id === payload.task.id ? payload.task : task,
            ),
          ),
        );
      }

      setEditingTask(null);
      router.refresh();
    } catch {
      setFormError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (task.status === status || !canUpdateTasks) {
      return;
    }

    const previousTask = task;

    setActionError(null);
    setStatusTaskId(task.id);
    setTasks((currentTasks) =>
      sortTasks(
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                status,
                updatedAt: new Date().toISOString(),
              }
            : currentTask,
        ),
      ),
    );

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        body: JSON.stringify({ status } satisfies UpdateTaskInput),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === previousTask.id ? previousTask : currentTask,
          ),
        );
        setActionError(readApiErrorMessage(body, "Unable to update task status."));
        return;
      }

      const payload = readApiData<{ task: Task }>(body);

      if (payload?.task) {
        setTasks((currentTasks) =>
          sortTasks(
            currentTasks.map((currentTask) =>
              currentTask.id === payload.task.id ? payload.task : currentTask,
            ),
          ),
        );
      }
    } catch {
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === previousTask.id ? previousTask : currentTask,
        ),
      );
      setActionError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setStatusTaskId(null);
    }
  }

  function handleTaskDrop(taskId: string, status: TaskStatus) {
    setDraggedTaskId(null);
    setDragPreviewPosition(null);

    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
      return;
    }

    void handleStatusChange(task, status);
  }

  async function handleDeleteTask() {
    if (!deleteTarget || !canDeleteTasks) {
      return;
    }

    setActionError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/tasks/${deleteTarget.id}`, {
        credentials: "include",
        method: "DELETE",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setActionError(readApiErrorMessage(body, "Unable to delete task."));
        setDeleteTarget(null);
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setActionError("Unable to reach TaskFlow. Please try again.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {draggedTask && dragPreviewPosition ? (
        <TaskDragPreview
          currentUser={currentUser}
          position={dragPreviewPosition}
          task={draggedTask}
          usersById={usersById}
        />
      ) : null}

      <section className="rounded-md border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-mint">
              Project board
            </p>
            <h2 className="mt-1 text-xl font-semibold text-ink">
              Issue workflow
            </h2>
          </div>
          {canCreateTasks ? (
            <Button
              onClick={() => {
                setActionError(null);
                setFormError(null);
                setCreateTaskStatus(TaskStatus.Todo);
                setIsCreateModalOpen(true);
              }}
              type="button"
            >
              New task
            </Button>
          ) : null}
        </div>

        {actionError ? (
          <div
            className="mt-4 rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center text-ink/65" role="status">
            <span
              aria-hidden="true"
              className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-mint border-r-transparent"
            />
            <span className="text-sm font-semibold">Loading tasks...</span>
          </div>
        ) : loadError ? (
          <div className="mt-4 rounded-md border border-dashed border-ink/15 bg-surface p-6 text-center">
            <h3 className="text-base font-semibold text-ink">
              Tasks could not be loaded
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
              {loadError}
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
        ) : (
          <div className="mt-4 flex min-h-[28rem] gap-3 overflow-x-auto">
            {groupedTasks.map((column) => (
              <StatusColumn
                canCreateTasks={canCreateTasks}
                canDeleteTasks={canDeleteTasks}
                canUpdateTasks={canUpdateTasks}
                currentUser={currentUser}
                draggedTaskId={draggedTaskId}
                isStatusUpdating={(taskId) => statusTaskId === taskId}
                key={column.status}
                onDeleteTask={setDeleteTarget}
                onEditTask={(task) => {
                  setActionError(null);
                  setFormError(null);
                  setEditingTask(task);
                }}
                onOpenTask={(task) => {
                  setActionError(null);
                  setSelectedTaskId(task.id);
                }}
                onAddTask={(status) => {
                  setActionError(null);
                  setFormError(null);
                  setCreateTaskStatus(status);
                  setIsCreateModalOpen(true);
                }}
                onStatusChange={handleStatusChange}
                onTaskDragEnd={() => {
                  setDraggedTaskId(null);
                  setDragPreviewPosition(null);
                }}
                onTaskDragMove={(position) => setDragPreviewPosition(position)}
                onTaskDragStart={(task, position) => {
                  setActionError(null);
                  setDraggedTaskId(task.id);
                  setDragPreviewPosition(position);
                }}
                onTaskDrop={handleTaskDrop}
                status={column.status}
                tasks={column.tasks}
                usersById={usersById}
              />
            ))}
          </div>
        )}
      </section>

      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
          }
        }}
        title="Create task"
      >
        <TaskForm
          error={formError}
          initialValues={createTaskInitialValues}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setFormError(null);
            setIsCreateModalOpen(false);
          }}
          onSubmit={handleCreateTask}
          submitLabel="Create task"
          submittingLabel="Creating..."
        />
      </TaskModal>

      <TaskModal
        isOpen={Boolean(editingTask)}
        onClose={() => {
          if (!isSubmitting) {
            setEditingTask(null);
          }
        }}
        title="Edit task"
      >
        <TaskForm
          error={formError}
          initialValues={editTaskInitialValues}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setFormError(null);
            setEditingTask(null);
          }}
          onSubmit={handleUpdateTask}
          submitLabel="Save changes"
        />
      </TaskModal>

      <TaskModal
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        size="lg"
        title="Task details"
      >
        {selectedTaskId ? (
          <TaskDetails currentUser={currentUser} taskId={selectedTaskId} />
        ) : null}
      </TaskModal>

      <ConfirmDialog
        confirmLabel="Delete task"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}" from this project. This action cannot be undone.`
            : "Delete this task from the project. This action cannot be undone."
        }
        isConfirming={isDeleting}
        isOpen={Boolean(deleteTarget)}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteTask}
        title="Delete this task?"
      />
    </>
  );
}

function TaskModal({
  children,
  isOpen,
  onClose,
  size = "md",
  title,
}: {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: "md" | "lg";
  title: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-ink/35 px-4 py-6">
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={[
          "w-full rounded-md border border-ink/10 bg-white p-5 shadow-xl",
          size === "lg" ? "max-w-4xl" : "max-w-2xl",
        ].join(" ")}
        role="dialog"
      >
        <div className="mb-5 border-b border-ink/10 pb-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Task
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink" id={titleId}>
            {title}
          </h2>
        </div>
        {children}
      </div>
    </div>
  );
}

function buildTaskInput(values: TaskFormValues): CreateTaskInput & UpdateTaskInput {
  return {
    assigneeId: values.assigneeId || null,
    description: values.description || null,
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    priority: values.priority,
    status: values.status,
    title: values.title,
  };
}

function taskToFormValues(task: Task): TaskFormValues {
  return {
    assigneeId: task.assigneeId ?? "",
    description: task.description ?? "",
    dueDate: task.dueDate ? toDateTimeLocalValue(task.dueDate) : "",
    priority: task.priority,
    status: task.status,
    title: task.title,
  };
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
}

function buildUserNameLookup(
  currentUser: SafeUser,
  users: SafeUser[] = [],
): UserNameLookup {
  const userNames = new Map<string, string>();

  userNames.set(currentUser.id, currentUser.name);

  for (const user of users) {
    userNames.set(user.id, user.name);
  }

  return userNames;
}
