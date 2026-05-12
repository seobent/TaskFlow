import {
  idSchema,
  ProjectMemberRole,
  updateProjectMemberSchema,
} from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import {
  findProjectMemberAccess,
  serializeProjectMember,
} from "@/lib/project-members";

const { projectMembers, users } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");
const userIdSchema = idSchema.uuid("Invalid user id.");

type ProjectMemberRouteContext = {
  params: Promise<{
    id: string;
    userId: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: ProjectMemberRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const routeParams = await parseRouteParams(context);

    if (!routeParams.ok) {
      return routeParams.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateProjectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findProjectMemberAccess(routeParams.projectId, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canManage) {
      return apiError("Project owner access required.", 403);
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, routeParams.userId),
    });

    if (!targetUser) {
      return apiError("User not found.", 404);
    }

    const existingMember = await findProjectMember(
      routeParams.projectId,
      routeParams.userId,
    );

    if (!existingMember) {
      return apiError("Project member not found.", 404);
    }

    if (
      access.project.ownerId === routeParams.userId ||
      existingMember.role === ProjectMemberRole.Owner
    ) {
      return apiError(
        "Project owner role cannot be changed through this endpoint.",
        400,
      );
    }

    const [updatedMember] = await db
      .update(projectMembers)
      .set({
        role: parsed.data.role,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectMembers.projectId, routeParams.projectId),
          eq(projectMembers.userId, routeParams.userId),
        ),
      )
      .returning();

    if (!updatedMember) {
      return apiError("Project member not found.", 404);
    }

    return apiSuccess({
      member: serializeProjectMember(updatedMember, targetUser),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to update project member.", 500);
  }
}

export async function DELETE(
  request: Request,
  context: ProjectMemberRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const routeParams = await parseRouteParams(context);

    if (!routeParams.ok) {
      return routeParams.response;
    }

    const access = await findProjectMemberAccess(routeParams.projectId, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canManage) {
      return apiError("Project owner access required.", 403);
    }

    const targetUser = await db.query.users.findFirst({
      columns: {
        id: true,
      },
      where: eq(users.id, routeParams.userId),
    });

    if (!targetUser) {
      return apiError("User not found.", 404);
    }

    const existingMember = await findProjectMember(
      routeParams.projectId,
      routeParams.userId,
    );

    if (!existingMember) {
      return apiError("Project member not found.", 404);
    }

    if (
      access.project.ownerId === routeParams.userId ||
      existingMember.role === ProjectMemberRole.Owner
    ) {
      return apiError(
        "Project owner cannot be removed through this endpoint.",
        400,
      );
    }

    const [deletedMember] = await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, routeParams.projectId),
          eq(projectMembers.userId, routeParams.userId),
        ),
      )
      .returning({ id: projectMembers.id });

    if (!deletedMember) {
      return apiError("Project member not found.", 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to remove project member.", 500);
  }
}

async function findProjectMember(projectId: string, userId: string) {
  return db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId),
    ),
  });
}

async function parseRouteParams(context: ProjectMemberRouteContext) {
  const { id, userId } = await context.params;
  const parsedProjectId = projectIdSchema.safeParse(id);

  if (!parsedProjectId.success) {
    return {
      ok: false as const,
      response: apiError(
        "Invalid project id.",
        400,
        parsedProjectId.error.flatten(),
      ),
    };
  }

  const parsedUserId = userIdSchema.safeParse(userId);

  if (!parsedUserId.success) {
    return {
      ok: false as const,
      response: apiError("Invalid user id.", 400, parsedUserId.error.flatten()),
    };
  }

  return {
    ok: true as const,
    projectId: parsedProjectId.data,
    userId: parsedUserId.data,
  };
}
