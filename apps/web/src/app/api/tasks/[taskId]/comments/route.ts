import { createCommentInputSchema, idSchema } from "@taskflow/shared";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  findTaskCommentAccess,
  serializeComment,
} from "@/lib/comments";

const { comments } = schema;
const taskIdSchema = idSchema.uuid("Invalid task id.");

type TaskCommentsRouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: TaskCommentsRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    const access = await findTaskCommentAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!access.canAccess) {
      return apiError("Task comment access denied.", 403);
    }

    const commentRecords = await db
      .select()
      .from(comments)
      .where(eq(comments.taskId, taskId.value))
      .orderBy(asc(comments.createdAt));

    return apiSuccess({
      comments: commentRecords.map(serializeComment),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load comments.", 500);
  }
}

export async function POST(
  request: Request,
  context: TaskCommentsRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createCommentInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findTaskCommentAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!access.canAccess) {
      return apiError("Task comment access denied.", 403);
    }

    const [createdComment] = await db
      .insert(comments)
      .values({
        taskId: taskId.value,
        authorId: user.id,
        content: parsed.data.content,
      })
      .returning();

    if (!createdComment) {
      throw new Error("Comment insert returned no row.");
    }

    return apiSuccess({ comment: serializeComment(createdComment) }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to create comment.", 500);
  }
}

async function parseTaskId(context: TaskCommentsRouteContext) {
  const { taskId } = await context.params;
  const parsed = taskIdSchema.safeParse(taskId);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid task id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
