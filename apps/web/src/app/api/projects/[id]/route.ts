import {
  type Project,
  type SafeUser,
  idSchema,
  updateProjectInputSchema,
} from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth, sanitizeUser } from "@/lib/auth";
import {
  findProjectAccess,
  serializeProject,
  type ProjectRecord,
} from "@/lib/projects";

const { projects, users } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");

type ProjectWithOwner = Project & {
  owner: SafeUser | null;
  permissions?: {
    canCreateTask: boolean;
    canManage: boolean;
    canManageMembers: boolean;
  };
};

type ProjectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireAuth(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    const access = await findProjectAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canView) {
      return apiError("Project access denied.", 403);
    }

    return apiSuccess({
      project: {
        ...(await serializeProjectWithOwner(access.project)),
        permissions: {
          canCreateTask: access.canCreateTask,
          canManage: access.canManage,
          canManageMembers: access.canManageMembers,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load project.", 500);
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
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

    const parsed = updateProjectInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findProjectAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canManage) {
      return apiError("Project manager access required.", 403);
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId.value))
      .returning();

    if (!updatedProject) {
      return apiError("Project not found.", 404);
    }

    return apiSuccess({
      project: {
        ...(await serializeProjectWithOwner(updatedProject)),
        permissions: {
          canCreateTask: access.canCreateTask,
          canManage: access.canManage,
          canManageMembers: access.canManageMembers,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to update project.", 500);
  }
}

async function serializeProjectWithOwner(
  project: ProjectRecord,
): Promise<ProjectWithOwner> {
  const owner = project.ownerId
    ? await db.query.users.findFirst({
        columns: {
          createdAt: true,
          email: true,
          id: true,
          name: true,
          role: true,
          updatedAt: true,
        },
        where: eq(users.id, project.ownerId),
      })
    : null;

  return {
    ...serializeProject(project),
    owner: owner ? sanitizeUser(owner) : null,
  };
}

export async function DELETE(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireAuth(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    const access = await findProjectAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canManage) {
      return apiError("Project manager access required.", 403);
    }

    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId.value))
      .returning({ id: projects.id });

    if (!deletedProject) {
      return apiError("Project not found.", 404);
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to delete project.", 500);
  }
}

async function parseProjectId(context: ProjectRouteContext) {
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
