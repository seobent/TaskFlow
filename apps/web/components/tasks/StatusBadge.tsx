import { TaskStatus } from "@taskflow/shared";

type StatusBadgeProps = {
  className?: string;
  status: TaskStatus;
};

export const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: "To Do",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.Done]: "Done",
};

const statusClasses: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: "border-ink/15 bg-ink/5 text-ink/65",
  [TaskStatus.InProgress]: "border-amber/25 bg-amber/10 text-amber",
  [TaskStatus.Done]: "border-mint/25 bg-mint/10 text-mint",
};

export function StatusBadge({ className = "", status }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-6 items-center rounded border px-2 text-xs font-semibold",
        statusClasses[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}
