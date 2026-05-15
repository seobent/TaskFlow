import {
  type ISODateString,
  type SafeUser,
  type Task,
  taskPrioritySchema,
  taskStatusSchema,
} from "@taskflow/shared";

import { schema } from "@/db";
import {
  getProjectAuthorization,
  getTaskAuthorization,
  isProjectParticipant,
} from "@/lib/authorization";

const { projects, tasks } = schema;

export type TaskRecord = typeof tasks.$inferSelect;
export type ProjectRecord = typeof projects.$inferSelect;

export type ProjectTaskAccess = {
  project: ProjectRecord | null;
  isProjectParticipant: boolean;
  canAccess: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type TaskAccess = {
  task: TaskRecord | null;
  project: ProjectRecord | null;
  isProjectParticipant: boolean;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function serializeTask(task: TaskRecord): Task {
  if (!task.projectId) {
    throw new Error("Task project is missing.");
  }

  if (!task.createdById) {
    throw new Error("Task creator is missing.");
  }

  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: taskStatusSchema.parse(task.status),
    priority: taskPrioritySchema.parse(task.priority),
    assigneeId: task.assigneeId,
    createdById: task.createdById,
    dueDate: serializeNullableTimestamp(task.dueDate),
    createdAt: serializeTimestamp(task.createdAt, "Task created timestamp is missing."),
    updatedAt: serializeTimestamp(task.updatedAt, "Task updated timestamp is missing."),
  };
}

export async function findProjectTaskAccess(
  projectId: string,
  user: SafeUser,
): Promise<ProjectTaskAccess> {
  const authorization = await getProjectAuthorization(user, projectId);
  const project = authorization.project;

  if (!project) {
    return {
      project: null,
      isProjectParticipant: false,
      canAccess: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    };
  }

  return {
    project,
    isProjectParticipant: authorization.isProjectParticipant,
    canAccess: authorization.canView,
    canCreate: authorization.canCreateTask,
    canUpdate: authorization.canUpdateTask,
    canDelete: authorization.canDeleteTask,
  };
}

export async function findTaskAccess(
  taskId: string,
  user: SafeUser,
): Promise<TaskAccess> {
  const authorization = await getTaskAuthorization(user, taskId);
  const task = authorization.task;

  if (!task) {
    return {
      task: null,
      project: null,
      isProjectParticipant: false,
      canView: false,
      canUpdate: false,
      canDelete: false,
    };
  }

  return {
    task,
    project: authorization.project,
    isProjectParticipant: authorization.isProjectParticipant,
    canView: authorization.canView,
    canUpdate: authorization.canUpdate,
    canDelete: authorization.canDelete,
  };
}

export { isProjectParticipant };

function serializeNullableTimestamp(value: Date | string | null) {
  return value ? serializeTimestamp(value, "Task timestamp is invalid.") : null;
}

function serializeTimestamp(
  value: Date | string | null,
  missingMessage: string,
): ISODateString {
  if (!value) {
    throw new Error(missingMessage);
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
