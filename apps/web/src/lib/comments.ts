import {
  type Comment,
  type ISODateString,
  type SafeUser,
} from "@taskflow/shared";

import { schema } from "@/db";
import {
  getTaskAuthorization,
  type ProjectRecord,
} from "@/lib/authorization";

const { comments, tasks } = schema;

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
  const authorization = await getTaskAuthorization(user, taskId);
  const task = authorization.task;

  if (!task) {
    return {
      task: null,
      project: null,
      canAccess: false,
    };
  }

  return {
    task,
    project: authorization.project,
    canAccess: authorization.canAccess,
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
