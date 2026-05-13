"use client";

import { type SafeUser, type Task, TaskStatus } from "@taskflow/shared";
import { type DragEvent, useState } from "react";

import { StatusBadge, statusLabels } from "@/components/tasks/StatusBadge";
import { TaskCard } from "@/components/tasks/TaskCard";

type StatusColumnProps = {
  currentUser: SafeUser;
  draggedTaskId: string | null;
  isStatusUpdating: (taskId: string) => boolean;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onTaskDragEnd: () => void;
  onTaskDragStart: (task: Task) => void;
  onTaskDrop: (taskId: string, status: TaskStatus) => void;
  status: TaskStatus;
  tasks: Task[];
};

export function StatusColumn({
  currentUser,
  draggedTaskId,
  isStatusUpdating,
  onDeleteTask,
  onEditTask,
  onOpenTask,
  onStatusChange,
  onTaskDragEnd,
  onTaskDragStart,
  onTaskDrop,
  status,
  tasks,
}: StatusColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const canDropTask = Boolean(draggedTaskId);

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!canDropTask) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    if (!canDropTask) {
      return;
    }

    event.preventDefault();
    setIsDragOver(false);

    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;

    if (taskId) {
      onTaskDrop(taskId, status);
    }
  }

  return (
    <section
      aria-label={`${statusLabels[status]} task column`}
      className={[
        "flex min-h-64 flex-col rounded-md border bg-surface p-3 transition",
        isDragOver
          ? "border-mint/60 ring-2 ring-mint/15"
          : canDropTask
            ? "border-mint/25"
            : "border-ink/10",
      ].join(" ")}
      onDragEnter={() => {
        if (canDropTask) {
          setIsDragOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragOver(false);
        }
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <StatusBadge status={status} />
        <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink/55">
          {tasks.length}
        </span>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              currentUser={currentUser}
              isDragging={draggedTaskId === task.id}
              isStatusUpdating={isStatusUpdating(task.id)}
              key={task.id}
              onDelete={onDeleteTask}
              onDragEnd={onTaskDragEnd}
              onDragStart={onTaskDragStart}
              onEdit={onEditTask}
              onOpen={onOpenTask}
              onStatusChange={onStatusChange}
              task={task}
            />
          ))
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-ink/15 bg-white px-3 py-4 text-center text-sm font-medium text-ink/45">
            No {statusLabels[status].toLowerCase()} tasks
          </div>
        )}
      </div>
    </section>
  );
}
