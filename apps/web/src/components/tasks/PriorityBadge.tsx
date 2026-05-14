import { TaskPriority } from "@taskflow/shared";

type PriorityBadgeProps = {
  className?: string;
  priority: TaskPriority;
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "Low",
  [TaskPriority.Medium]: "Medium",
  [TaskPriority.High]: "High",
};

const priorityClasses: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "border-mint/20 bg-mint/10 text-mint",
  [TaskPriority.Medium]: "border-amber/25 bg-amber/10 text-amber",
  [TaskPriority.High]: "border-berry/25 bg-berry/10 text-berry",
};

export function PriorityBadge({
  className = "",
  priority,
}: PriorityBadgeProps) {
  return (
    <span
      className={[
        "inline-flex min-h-6 items-center rounded border px-2 text-xs font-semibold",
        priorityClasses[priority],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {priorityLabels[priority]}
    </span>
  );
}
