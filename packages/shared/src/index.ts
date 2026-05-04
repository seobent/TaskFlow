export const TASKFLOW_APP_NAME = "TaskFlow";

export type TaskFlowRuntime = "development" | "preview" | "production";

export interface ApiEnvelope<TData> {
  data: TData;
  meta?: Record<string, unknown>;
}
