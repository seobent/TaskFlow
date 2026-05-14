"use client";

import { type SafeUser, type Task, TaskStatus } from "@taskflow/shared";
import { type DragEvent, useState } from "react";

import { TaskCard } from "@/components/tasks/TaskCard";
import { statusLabels } from "@/components/tasks/StatusBadge";
import type { UserNameLookup } from "@/components/tasks/task-formatting";

type StatusColumnProps = {
  currentUser: SafeUser;
  draggedTaskId: string | null;
  isStatusUpdating: (taskId: string) => boolean;
  onAddTask: (status: TaskStatus) => void;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onTaskDragEnd: () => void;
  onTaskDragMove: (position: { x: number; y: number }) => void;
  onTaskDragStart: (task: Task, position: { x: number; y: number }) => void;
  onTaskDrop: (taskId: string, status: TaskStatus) => void;
  status: TaskStatus;
  tasks: Task[];
  usersById?: UserNameLookup;
};

export function StatusColumn({
  currentUser,
  draggedTaskId,
  isStatusUpdating,
  onAddTask,
  onDeleteTask,
  onEditTask,
  onOpenTask,
  onStatusChange,
  onTaskDragEnd,
  onTaskDragMove,
  onTaskDragStart,
  onTaskDrop,
  status,
  tasks,
  usersById,
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
        "flex max-h-[36rem] min-h-44 w-72 shrink-0 flex-col overflow-hidden rounded-md border bg-[#ebecf0] transition",
        isDragOver
          ? "border-sky-400 ring-2 ring-sky-300"
          : canDropTask
            ? "border-white/50"
            : "border-transparent",
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
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <h3 className="text-sm font-semibold text-[#172033]">
          {statusLabels[status]}
        </h3>
        <span className="text-sm font-medium text-[#172033]/60">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {isDragOver ? (
          <div className="min-h-10 rounded-md bg-[#d8dce2] ring-1 ring-sky-300" />
        ) : null}
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              currentUser={currentUser}
              isDragging={draggedTaskId === task.id}
              isStatusUpdating={isStatusUpdating(task.id)}
              key={task.id}
              onDelete={onDeleteTask}
              onDragEnd={onTaskDragEnd}
              onDragMove={onTaskDragMove}
              onDragStart={onTaskDragStart}
              onEdit={onEditTask}
              onOpen={onOpenTask}
              onStatusChange={onStatusChange}
              task={task}
              usersById={usersById}
            />
          ))
        ) : (
          <div className="flex min-h-20 items-center justify-center rounded-md bg-[#dfe1e6] px-3 py-4 text-center text-sm font-medium text-[#172033]/45">
            Drop a card here
          </div>
        )}
      </div>
      <button
        className="mx-2 mb-2 flex min-h-10 items-center rounded-md px-2 text-left text-sm font-medium text-[#172033]/70 transition hover:bg-[#d8dce2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => onAddTask(status)}
        type="button"
      >
        <span className="mr-2 text-lg leading-none">+</span>
        Add a card
      </button>
    </section>
  );
}
