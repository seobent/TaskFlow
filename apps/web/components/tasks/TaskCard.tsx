"use client";

import { type SafeUser, type Task, TaskStatus } from "@taskflow/shared";
import { type DragEvent } from "react";

import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { StatusBadge, statusLabels } from "@/components/tasks/StatusBadge";
import {
  formatTaskDate,
  formatUserReference,
} from "@/components/tasks/task-formatting";
import { Button } from "@/components/ui/Button";

type TaskCardProps = {
  currentUser: SafeUser;
  isDragging?: boolean;
  isStatusUpdating?: boolean;
  onDelete: (task: Task) => void;
  onDragEnd: () => void;
  onDragStart: (task: Task) => void;
  onEdit: (task: Task) => void;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  task: Task;
};

const statusOptions = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Done,
];

export function TaskCard({
  currentUser,
  isDragging = false,
  isStatusUpdating = false,
  onDelete,
  onDragEnd,
  onDragStart,
  onEdit,
  onOpen,
  onStatusChange,
  task,
}: TaskCardProps) {
  const assigneeLabel = formatUserReference(task.assigneeId, currentUser);
  const creatorLabel = formatUserReference(task.createdById, currentUser);

  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    onDragStart(task);
  }

  return (
    <article
      aria-label={`Drag ${task.title}`}
      className={[
        "cursor-grab rounded-md border border-ink/10 bg-white p-4 shadow-sm transition active:cursor-grabbing",
        isDragging ? "opacity-60 ring-2 ring-mint/20" : "hover:border-mint/25",
      ].join(" ")}
      draggable={!isStatusUpdating}
      onDragEnd={onDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words text-base font-semibold leading-6 text-ink">
            <button
              className="text-left transition hover:text-mint focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              onClick={() => onOpen(task)}
              type="button"
            >
              {task.title}
            </button>
          </h4>
          <p className="mt-1 text-xs font-medium text-ink/45">
            Updated {formatTaskDate(task.updatedAt)}
          </p>
        </div>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description ? (
        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-ink/65">
          {task.description}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 text-xs text-ink/55">
        <div>
          <dt className="font-semibold uppercase tracking-wide">Due</dt>
          <dd className="mt-1 font-medium text-ink/75">
            {task.dueDate ? formatTaskDate(task.dueDate) : "No due date"}
          </dd>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="font-semibold uppercase tracking-wide">Assignee</dt>
            <dd
              className="mt-1 break-words font-medium text-ink/75"
              title={task.assigneeId ?? undefined}
            >
              {assigneeLabel}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide">Creator</dt>
            <dd
              className="mt-1 break-words font-medium text-ink/75"
              title={task.createdById}
            >
              {creatorLabel}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-4 rounded-md bg-surface p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <StatusBadge status={task.status} />
          <select
            aria-label={`Change status for ${task.title}`}
            className="min-h-9 rounded-md border border-ink/15 bg-white px-2 text-sm font-medium text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:text-ink/45"
            disabled={isStatusUpdating}
            onChange={(event) =>
              onStatusChange(task, event.target.value as TaskStatus)
            }
            value={task.status}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          onClick={() => onOpen(task)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Details
        </Button>
        <Button
          onClick={() => onEdit(task)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Edit
        </Button>
        <Button
          onClick={() => onDelete(task)}
          size="sm"
          type="button"
          variant="danger"
        >
          Delete
        </Button>
      </div>
    </article>
  );
}
