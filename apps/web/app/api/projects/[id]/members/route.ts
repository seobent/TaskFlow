import {
  assignProjectMemberSchema,
  idSchema,
  ProjectMemberRole,
} from "@taskflow/shared";
import { asc, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth, sanitizeUser } from "@/lib/auth";
import {
  findProjectMemberAccess,
  safeMemberUserSelection,
  serializeProjectMember,
} from "@/lib/project-members";

const { projectMembers, users } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");

type ProjectMembersRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: ProjectMembersRouteContext,
) {
  try {
    const user = await requireAuth(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    const access = await findProjectMemberAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canList) {
      return apiError("Project member access denied.", 403);
    }

    const memberRows = await db
      .select({
        member: {
          id: projectMembers.id,
          projectId: projectMembers.projectId,
          userId: projectMembers.userId,
          role: projectMembers.role,
          createdAt: projectMembers.createdAt,
          updatedAt: projectMembers.updatedAt,
        },
        user: safeMemberUserSelection,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId.value))
      .orderBy(asc(projectMembers.role), asc(users.name));

    const assignableUsers = access.canManage
      ? await db
          .select(safeMemberUserSelection)
          .from(users)
          .orderBy(asc(users.name), asc(users.email))
      : [];

    return apiSuccess({
      assignableUsers: assignableUsers.map(sanitizeUser),
      canManage: access.canManage,
      members: memberRows.map((row) =>
        serializeProjectMember(row.member, row.user),
      ),
      project: {
        id: access.project.id,
        name: access.project.name,
        ownerId: access.project.ownerId,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load project members.", 500);
  }
}

export async function POST(
  request: Request,
  context: ProjectMembersRouteContext,
) {
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

    const parsed = assignProjectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const access = await findProjectMemberAccess(projectId.value, user);

    if (!access.project) {
      return apiError("Project not found.", 404);
    }

    if (!access.canManage) {
      return apiError("Project owner access required.", 403);
    }

    if (access.project.ownerId === parsed.data.userId) {
      return apiError("User is already assigned to the project.", 409);
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, parsed.data.userId),
    });

    if (!targetUser) {
      return apiError("User not found.", 404);
    }

    try {
      const [createdMember] = await db
        .insert(projectMembers)
        .values({
          projectId: projectId.value,
          userId: parsed.data.userId,
          role: parsed.data.role ?? ProjectMemberRole.Member,
        })
        .returning();

      if (!createdMember) {
        throw new Error("Project member insert returned no row.");
      }

      return apiSuccess(
        { member: serializeProjectMember(createdMember, targetUser) },
        201,
      );
    } catch (error) {
      if (isDuplicateProjectMemberError(error)) {
        return apiError("User is already assigned to the project.", 409);
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to assign project member.", 500);
  }
}

async function parseProjectId(context: ProjectMembersRouteContext) {
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

function isDuplicateProjectMemberError(error: unknown) {
  const pgError = error as {
    code?: string;
    constraint?: string;
    message?: string;
  };

  return (
    pgError.code === "23505" &&
    (pgError.constraint === "project_members_project_id_user_id_unique" ||
      pgError.message?.includes("project_members_project_id_user_id_unique"))
  );
}
