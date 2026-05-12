import { TASKFLOW_APP_NAME } from "@taskflow/shared";

type TaskFlowLogoProps = {
  className?: string;
};

export function TaskFlowLogo({ className = "h-10 w-auto" }: TaskFlowLogoProps) {
  return (
    <img
      alt={`${TASKFLOW_APP_NAME} logo`}
      className={className}
      height={90}
      src="/taskflow-logo.svg"
      width={320}
    />
  );
}
