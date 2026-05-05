import {
  type ISODateString,
  type SafeUser,
  type Task,
  taskPrioritySchema,
  taskStatusSchema,
  UserRole,
} from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";

const { projectMembers, projects, tasks } = schema;

export type TaskRecord = typeof tasks.$inferSelect;
export type ProjectRecord = typeof projects.$inferSelect;

export type ProjectTaskAccess = {
  project: ProjectRecord | null;
  isProjectParticipant: boolean;
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
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return {
      project: null,
      isProjectParticipant: false,
    };
  }

  return {
    project,
    isProjectParticipant: await isProjectParticipant(project, user.id),
  };
}

export async function findTaskAccess(
  taskId: string,
  user: SafeUser,
): Promise<TaskAccess> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

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

  const project = task.projectId
    ? await db.query.projects.findFirst({
        where: eq(projects.id, task.projectId),
      })
    : null;
  const isParticipant = project
    ? await isProjectParticipant(project, user.id)
    : false;
  const isCreator = task.createdById === user.id;
  const isAssignee = task.assigneeId === user.id;
  const isAdmin = user.role === UserRole.Admin;
  const isProjectOwner = project?.ownerId === user.id;

  return {
    task,
    project: project ?? null,
    isProjectParticipant: isParticipant,
    canView: isAdmin || isParticipant || isCreator || isAssignee,
    canUpdate: isParticipant,
    canDelete: isAdmin || isProjectOwner || isCreator || isAssignee,
  };
}

export async function isProjectParticipant(
  project: ProjectRecord,
  userId: string,
) {
  if (project.ownerId === userId) {
    return true;
  }

  const membership = await db.query.projectMembers.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(projectMembers.projectId, project.id),
      eq(projectMembers.userId, userId),
    ),
  });

  return Boolean(membership);
}

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
