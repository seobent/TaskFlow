import {
  createTaskInputSchema,
  idSchema,
  TaskPriority,
  TaskStatus,
} from "@taskflow/shared";
import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  findProjectTaskAccess,
  isProjectParticipant,
  serializeTask,
  type ProjectRecord,
} from "@/lib/tasks";

const { tasks } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");

type ProjectTasksRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: ProjectTasksRouteContext) {
  try {
    const user = await requireAuth(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    const access = await findProjectTaskAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.isProjectParticipant) {
      return apiError("Project task access denied.", 403);
    }

    const taskRecords = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId.value))
      .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt));

    return apiSuccess({
      tasks: taskRecords.map(serializeTask),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load tasks.", 500);
  }
}

export async function POST(request: Request, context: ProjectTasksRouteContext) {
  try {
    const user = await requireAuth(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createTaskInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findProjectTaskAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.isProjectParticipant) {
      return apiError("Project task access denied.", 403);
    }

    if (!(await isValidProjectAssignee(access.project, parsed.data.assigneeId))) {
      return apiError("Assignee must belong to the project.", 400);
    }

    const [createdTask] = await db
      .insert(tasks)
      .values({
        projectId: projectId.value,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status ?? TaskStatus.Todo,
        priority: parsed.data.priority ?? TaskPriority.Medium,
        assigneeId: parsed.data.assigneeId ?? null,
        createdById: user.id,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      })
      .returning();

    if (!createdTask) {
      throw new Error("Task insert returned no row.");
    }

    return apiSuccess({ task: serializeTask(createdTask) }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to create task.", 500);
  }
}

async function isValidProjectAssignee(
  project: ProjectRecord,
  assigneeId: string | null | undefined,
) {
  return assigneeId ? isProjectParticipant(project, assigneeId) : true;
}

async function parseProjectId(context: ProjectTasksRouteContext) {
  const { id } = await context.params;
  const parsed = projectIdSchema.safeParse(id);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid project id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
