import { TASKFLOW_APP_NAME } from "@taskflow/shared";

type TaskFlowLogoProps = {
  className?: string;
};

export function TaskFlowLogo({ className = "h-10 w-auto" }: TaskFlowLogoProps) {
  return (
    <span
      aria-label={`${TASKFLOW_APP_NAME} logo`}
      className={`inline-block ${className}`}
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className="taskflow-logo-light h-full w-auto"
        height={90}
        src="/taskflow-logo.svg"
        width={320}
      />
      <img
        alt=""
        aria-hidden="true"
        className="taskflow-logo-dark h-full w-auto"
        height={90}
        src="/taskflow-logo-dark.svg"
        width={320}
      />
    </span>
  );
}
