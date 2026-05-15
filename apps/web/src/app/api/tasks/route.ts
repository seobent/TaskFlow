import {
  createTaskInputSchema,
  idSchema,
  TaskPriority,
  TaskStatus,
  type SafeUser,
  taskPrioritySchema,
  taskStatusSchema,
} from "@taskflow/shared";
import { and, desc, eq, isNotNull, or, type SQL } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { isAdmin, isManager } from "@/lib/authorization";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  findProjectTaskAccess,
  isProjectParticipant,
  serializeTask,
  type ProjectRecord,
} from "@/lib/tasks";

const { projectMembers, projects, tasks } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");
const assigneeIdSchema = idSchema.uuid("Invalid assignee id.");
const createdByIdSchema = idSchema.uuid("Invalid creator id.");
const createTaskWithProjectInputSchema = createTaskInputSchema.extend({
  projectId: projectIdSchema,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const parsedFilters = parseTaskFilters(new URL(request.url).searchParams);

    if (!parsedFilters.ok) {
      return parsedFilters.response;
    }

    const taskRecords =
      isAdmin(user)
        ? await listAdminTasks(parsedFilters.conditions)
        : await listAccessibleTasks(user, parsedFilters.conditions);

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

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createTaskWithProjectInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findProjectTaskAccess(parsed.data.projectId, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canAccess) {
      return apiError("Project task access denied.", 403);
    }

    if (!access.canCreate) {
      return apiError("Manager access required to create tasks.", 403);
    }

    if (!(await isValidProjectAssignee(access.project, parsed.data.assigneeId))) {
      return apiError("Assignee must belong to the project.", 400);
    }

    const [createdTask] = await db
      .insert(tasks)
      .values({
        projectId: parsed.data.projectId,
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

async function listAdminTasks(filterConditions: SQL[]) {
  const whereClause =
    filterConditions.length > 0 ? and(...filterConditions) : undefined;

  return whereClause
    ? db
        .select()
        .from(tasks)
        .where(whereClause)
        .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt))
    : db.select().from(tasks).orderBy(desc(tasks.updatedAt), desc(tasks.createdAt));
}

async function listAccessibleTasks(
  user: Pick<SafeUser, "id" | "role">,
  filterConditions: SQL[],
) {
  const accessCondition = buildTaskListAccessCondition(user);

  if (!accessCondition) {
    throw new Error("Task access condition could not be built.");
  }

  const rows = await db
    .select({
      task: tasks,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, user.id),
      ),
    )
    .where(and(...filterConditions, accessCondition))
    .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt));

  return rows.map((row) => row.task);
}

function buildTaskListAccessCondition(user: Pick<SafeUser, "id" | "role">) {
  const assignedProjectCondition = isNotNull(projectMembers.id);

  if (!isManager(user)) {
    return assignedProjectCondition;
  }

  return or(eq(projects.ownerId, user.id), assignedProjectCondition);
}

function parseTaskFilters(searchParams: URLSearchParams) {
  const conditions: SQL[] = [];
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assigneeId");
  const createdById = searchParams.get("createdById");

  if (projectId !== null) {
    const parsed = projectIdSchema.safeParse(projectId);

    if (!parsed.success) {
      return {
        ok: false as const,
        response: apiError(
          "Invalid query parameters.",
          400,
          parsed.error.flatten(),
        ),
      };
    }

    conditions.push(eq(tasks.projectId, parsed.data));
  }

  if (status !== null) {
    const parsed = taskStatusSchema.safeParse(status);

    if (!parsed.success) {
      return {
        ok: false as const,
        response: apiError(
          "Invalid query parameters.",
          400,
          parsed.error.flatten(),
        ),
      };
    }

    conditions.push(eq(tasks.status, parsed.data));
  }

  if (priority !== null) {
    const parsed = taskPrioritySchema.safeParse(priority);

    if (!parsed.success) {
      return {
        ok: false as const,
        response: apiError(
          "Invalid query parameters.",
          400,
          parsed.error.flatten(),
        ),
      };
    }

    conditions.push(eq(tasks.priority, parsed.data));
  }

  if (assigneeId !== null) {
    const parsed = assigneeIdSchema.safeParse(assigneeId);

    if (!parsed.success) {
      return {
        ok: false as const,
        response: apiError(
          "Invalid query parameters.",
          400,
          parsed.error.flatten(),
        ),
      };
    }

    conditions.push(eq(tasks.assigneeId, parsed.data));
  }

  if (createdById !== null) {
    const parsed = createdByIdSchema.safeParse(createdById);

    if (!parsed.success) {
      return {
        ok: false as const,
        response: apiError(
          "Invalid query parameters.",
          400,
          parsed.error.flatten(),
        ),
      };
    }

    conditions.push(eq(tasks.createdById, parsed.data));
  }

  return {
    ok: true as const,
    conditions,
  };
}

async function isValidProjectAssignee(
  project: ProjectRecord,
  assigneeId: string | null | undefined,
) {
  return assigneeId ? isProjectParticipant(project, assigneeId) : true;
}
