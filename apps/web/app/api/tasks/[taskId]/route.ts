import { idSchema, updateTaskInputSchema } from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  findTaskAccess,
  isProjectParticipant,
  serializeTask,
} from "@/lib/tasks";

const { tasks } = schema;
const taskIdSchema = idSchema.uuid("Invalid task id.");

type TaskRouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: TaskRouteContext) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    const access = await findTaskAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!access.canView) {
      return apiError("Task access denied.", 403);
    }

    return apiSuccess({ task: serializeTask(access.task) });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load task.", 500);
  }
}

export async function PATCH(request: Request, context: TaskRouteContext) {
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

    const parsed = updateTaskInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findTaskAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!access.canUpdate || !access.project) {
      return apiError("Project task access denied.", 403);
    }

    if (
      parsed.data.assigneeId &&
      !(await isProjectParticipant(access.project, parsed.data.assigneeId))
    ) {
      return apiError("Assignee must belong to the project.", 400);
    }

    const updateValues: Partial<typeof tasks.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.title !== undefined) {
      updateValues.title = parsed.data.title;
    }

    if (parsed.data.description !== undefined) {
      updateValues.description = parsed.data.description;
    }

    if (parsed.data.status !== undefined) {
      updateValues.status = parsed.data.status;
    }

    if (parsed.data.priority !== undefined) {
      updateValues.priority = parsed.data.priority;
    }

    if (parsed.data.assigneeId !== undefined) {
      updateValues.assigneeId = parsed.data.assigneeId;
    }

    if (parsed.data.dueDate !== undefined) {
      updateValues.dueDate = parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null;
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateValues)
      .where(eq(tasks.id, taskId.value))
      .returning();

    if (!updatedTask) {
      return apiError("Task not found.", 404);
    }

    return apiSuccess({ task: serializeTask(updatedTask) });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to update task.", 500);
  }
}

export async function DELETE(request: Request, context: TaskRouteContext) {
  try {
    const user = await requireAuth(request);
    const taskId = await parseTaskId(context);

    if (!taskId.ok) {
      return taskId.response;
    }

    const access = await findTaskAccess(taskId.value, user);

    if (!access.task) {
      return apiError("Task not found.", 404);
    }

    if (!access.canDelete) {
      return apiError("Task delete access denied.", 403);
    }

    const [deletedTask] = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId.value))
      .returning({ id: tasks.id });

    if (!deletedTask) {
      return apiError("Task not found.", 404);
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to delete task.", 500);
  }
}

async function parseTaskId(context: TaskRouteContext) {
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
