"use client";

import { type SafeUser, type Task, TaskStatus } from "@taskflow/shared";
import { type DragEvent } from "react";

import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { statusLabels } from "@/components/tasks/StatusBadge";
import {
  formatTaskDate,
  formatUserReference,
  type UserNameLookup,
} from "@/components/tasks/task-formatting";

type TaskCardProps = {
  currentUser: SafeUser;
  isDragging?: boolean;
  isStatusUpdating?: boolean;
  onDelete: (task: Task) => void;
  onDragEnd: () => void;
  onDragMove: (position: { x: number; y: number }) => void;
  onDragStart: (task: Task, position: { x: number; y: number }) => void;
  onEdit: (task: Task) => void;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  task: Task;
  usersById?: UserNameLookup;
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
  onDragMove,
  onDragStart,
  onEdit,
  onOpen,
  onStatusChange,
  task,
  usersById,
}: TaskCardProps) {
  const assigneeLabel = formatUserReference(
    task.assigneeId,
    currentUser,
    usersById,
  );
  const creatorLabel = formatUserReference(
    task.createdById,
    currentUser,
    usersById,
  );

  function handleDragStart(event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    setTransparentDragImage(event);
    onDragStart(task, { x: event.clientX, y: event.clientY });
  }

  return (
    <article
      aria-label={`Drag ${task.title}`}
      className={[
        "cursor-grab rounded-md border border-[#c7ccd4] bg-white px-3 py-2 text-[#172033] shadow-sm transition active:cursor-grabbing",
        isDragging
          ? "rotate-1 opacity-30 ring-2 ring-sky-300"
          : "hover:border-sky-300 hover:shadow-md",
      ].join(" ")}
      draggable={!isStatusUpdating}
      onDragEnd={onDragEnd}
      onDrag={(event) => {
        if (event.clientX || event.clientY) {
          onDragMove({ x: event.clientX, y: event.clientY });
        }
      }}
      onDragStart={handleDragStart}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-mint text-center text-[10px] font-bold leading-4 text-white"
        />
        <div className="min-w-0 flex-1">
          <button
            className="block w-full break-words text-left text-sm font-medium leading-5 transition hover:text-[#0c66e4] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]"
            onClick={() => onOpen(task)}
            type="button"
          >
            {task.title}
          </button>
          {task.description ? (
            <p className="mt-1 max-h-10 overflow-hidden whitespace-pre-line break-words text-sm leading-5 text-[#172033]/65">
              {task.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge
          className="min-h-5 px-1.5 text-[11px]"
          priority={task.priority}
        />
        {task.dueDate ? (
          <span className="rounded border border-[#c7ccd4] bg-[#f7f8fa] px-1.5 py-0.5 text-[11px] font-semibold text-[#172033]/65">
            {formatTaskDate(task.dueDate)}
          </span>
        ) : null}
        <span
          className="max-w-full truncate rounded border border-[#c7ccd4] bg-[#f7f8fa] px-1.5 py-0.5 text-[11px] font-semibold text-[#172033]/55"
          title={task.assigneeId ?? undefined}
        >
          {assigneeLabel}
        </span>
        {isStatusUpdating ? (
          <span className="text-[11px] font-semibold text-[#0c66e4]">
            Saving...
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#dfe1e6] pt-2">
        <select
          aria-label={`Change status for ${task.title}`}
          className="min-h-8 min-w-0 flex-1 rounded-md border border-[#c7ccd4] bg-white px-2 text-xs font-medium text-[#172033] shadow-sm transition focus:border-[#0c66e4] focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:text-[#172033]/45"
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
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="min-h-8 rounded-md px-2 text-xs font-semibold text-[#172033]/65 transition hover:bg-[#ebecf0] hover:text-[#172033] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]"
            onClick={() => onOpen(task)}
            type="button"
          >
            Open
          </button>
          <button
            className="min-h-8 rounded-md px-2 text-xs font-semibold text-[#172033]/65 transition hover:bg-[#ebecf0] hover:text-[#172033] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c66e4]"
            onClick={() => onEdit(task)}
            type="button"
          >
            Edit
          </button>
          <button
            className="min-h-8 rounded-md px-2 text-xs font-semibold text-berry transition hover:bg-berry/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry"
            onClick={() => onDelete(task)}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>

      <p className="mt-2 truncate text-[11px] font-medium text-[#172033]/45">
        Created by {creatorLabel} - Updated {formatTaskDate(task.updatedAt)}
      </p>
    </article>
  );
}

export function TaskDragPreview({
  currentUser,
  position,
  task,
  usersById,
}: {
  currentUser: SafeUser;
  position: { x: number; y: number };
  task: Task;
  usersById?: UserNameLookup;
}) {
  const assigneeLabel = formatUserReference(
    task.assigneeId,
    currentUser,
    usersById,
  );
  const creatorLabel = formatUserReference(
    task.createdById,
    currentUser,
    usersById,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-50 w-72 rotate-3 rounded-md border border-sky-300 bg-white px-3 py-2 text-[#172033] opacity-100 shadow-2xl"
      style={{
        left: position.x + 14,
        top: position.y + 14,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-mint" />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-5">
            {task.title}
          </p>
          {task.description ? (
            <p className="mt-1 max-h-10 overflow-hidden whitespace-pre-line break-words text-sm leading-5 text-[#172033]/65">
              {task.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge
          className="min-h-5 px-1.5 text-[11px]"
          priority={task.priority}
        />
        {task.dueDate ? (
          <span className="rounded border border-[#c7ccd4] bg-[#f7f8fa] px-1.5 py-0.5 text-[11px] font-semibold text-[#172033]/65">
            {formatTaskDate(task.dueDate)}
          </span>
        ) : null}
        <span className="max-w-full truncate rounded border border-[#c7ccd4] bg-[#f7f8fa] px-1.5 py-0.5 text-[11px] font-semibold text-[#172033]/55">
          {assigneeLabel}
        </span>
      </div>
      <p className="mt-2 truncate text-[11px] font-medium text-[#172033]/45">
        Created by {creatorLabel} - Updated {formatTaskDate(task.updatedAt)}
      </p>
    </div>
  );
}

function setTransparentDragImage(event: DragEvent<HTMLElement>) {
  const dragImage = document.createElement("span");

  dragImage.style.width = "1px";
  dragImage.style.height = "1px";
  dragImage.style.position = "fixed";
  dragImage.style.top = "-1000px";
  dragImage.style.opacity = "0";

  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, 0, 0);

  window.setTimeout(() => dragImage.remove(), 0);
}
