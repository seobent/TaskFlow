import { type SafeUser, type Task, TaskStatus } from "@taskflow/shared";

import { StatusBadge, statusLabels } from "@/components/tasks/StatusBadge";
import { TaskCard } from "@/components/tasks/TaskCard";

type StatusColumnProps = {
  currentUser: SafeUser;
  isStatusUpdating: (taskId: string) => boolean;
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  status: TaskStatus;
  tasks: Task[];
};

export function StatusColumn({
  currentUser,
  isStatusUpdating,
  onDeleteTask,
  onEditTask,
  onOpenTask,
  onStatusChange,
  status,
  tasks,
}: StatusColumnProps) {
  return (
    <section className="flex min-h-64 flex-col rounded-md border border-ink/10 bg-surface p-3">
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
              isStatusUpdating={isStatusUpdating(task.id)}
              key={task.id}
              onDelete={onDeleteTask}
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
