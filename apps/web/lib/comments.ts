import {
  type Comment,
  type ISODateString,
  type SafeUser,
  UserRole,
} from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { isProjectParticipant, type ProjectRecord } from "@/lib/tasks";

const { comments, projects, tasks } = schema;

export type CommentRecord = typeof comments.$inferSelect;
export type TaskRecord = typeof tasks.$inferSelect;

export type TaskCommentAccess = {
  task: TaskRecord | null;
  project: ProjectRecord | null;
  canAccess: boolean;
};

export function serializeComment(comment: CommentRecord): Comment {
  if (!comment.taskId) {
    throw new Error("Comment task is missing.");
  }

  if (!comment.authorId) {
    throw new Error("Comment author is missing.");
  }

  return {
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: serializeTimestamp(comment.createdAt),
  };
}

export async function findTaskCommentAccess(
  taskId: string,
  user: SafeUser,
): Promise<TaskCommentAccess> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) {
    return {
      task: null,
      project: null,
      canAccess: false,
    };
  }

  const project = task.projectId
    ? await db.query.projects.findFirst({
        where: eq(projects.id, task.projectId),
      })
    : null;

  if (user.role === UserRole.Admin) {
    return {
      task,
      project: project ?? null,
      canAccess: true,
    };
  }

  return {
    task,
    project: project ?? null,
    canAccess: project ? await isProjectParticipant(project, user.id) : false,
  };
}

function serializeTimestamp(value: Date | string | null): ISODateString {
  if (!value) {
    throw new Error("Comment timestamp is missing.");
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
