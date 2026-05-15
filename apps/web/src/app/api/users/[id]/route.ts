import { idSchema, updateUserRoleInputSchema, UserRole } from "@taskflow/shared";
import { count, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, sanitizeUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { attachments, comments, projectMembers, projects, tasks, users } = schema;
const userIdSchema = idSchema.uuid("Invalid user id.");

const safeUserSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type UserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: UserRouteContext) {
  try {
    await requireAdmin(request);
    const userId = await parseUserId(context);

    if (!userId.ok) {
      return userId.response;
    }

    const user = await db.query.users.findFirst({
      columns: safeUserColumns,
      where: eq(users.id, userId.value),
    });

    if (!user) {
      return apiError("User not found.", 404);
    }

    return apiSuccess({ user: sanitizeUser(user) });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load user.", 500);
  }
}

export async function PATCH(request: Request, context: UserRouteContext) {
  try {
    await requireAdmin(request);
    const userId = await parseUserId(context);

    if (!userId.ok) {
      return userId.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateUserRoleInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const updatedUser = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        columns: safeUserColumns,
        where: eq(users.id, userId.value),
      });

      if (!existingUser) {
        return null;
      }

      if (
        existingUser.role === UserRole.Admin &&
        parsed.data.role !== UserRole.Admin
      ) {
        const adminCount = await countAdminUsers(tx);

        if (adminCount <= 1) {
          throw new LastAdminError();
        }
      }

      const [updated] = await tx
        .update(users)
        .set({
          role: parsed.data.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId.value))
        .returning(safeUserSelection);

      return updated ?? null;
    });

    if (!updatedUser) {
      return apiError("User not found.", 404);
    }

    return apiSuccess({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    if (error instanceof LastAdminError) {
      return apiError("Cannot remove the last admin.", 400);
    }

    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to update user.", 500);
  }
}

export async function DELETE(request: Request, context: UserRouteContext) {
  try {
    const currentUser = await requireAdmin(request);
    const userId = await parseUserId(context);

    if (!userId.ok) {
      return userId.response;
    }

    if (userId.value === currentUser.id) {
      return apiError("Admins cannot delete their own account.", 400);
    }

    const deletedUser = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        columns: {
          id: true,
          role: true,
        },
        where: eq(users.id, userId.value),
      });

      if (!existingUser) {
        return null;
      }

      if (existingUser.role === UserRole.Admin) {
        const adminCount = await countAdminUsers(tx);

        if (adminCount <= 1) {
          throw new LastAdminError();
        }
      }

      await tx
        .update(projects)
        .set({
          ownerId: null,
          updatedAt: new Date(),
        })
        .where(eq(projects.ownerId, userId.value));

      await tx
        .update(tasks)
        .set({
          assigneeId: null,
          updatedAt: new Date(),
        })
        .where(eq(tasks.assigneeId, userId.value));

      await tx
        .update(tasks)
        .set({
          createdById: null,
          updatedAt: new Date(),
        })
        .where(eq(tasks.createdById, userId.value));

      await tx
        .update(comments)
        .set({
          authorId: null,
        })
        .where(eq(comments.authorId, userId.value));

      await tx
        .update(attachments)
        .set({
          uploadedById: null,
        })
        .where(eq(attachments.uploadedById, userId.value));

      await tx
        .delete(projectMembers)
        .where(eq(projectMembers.userId, userId.value));

      const [deleted] = await tx
        .delete(users)
        .where(eq(users.id, userId.value))
        .returning({ id: users.id });

      return deleted ?? null;
    });

    if (!deletedUser) {
      return apiError("User not found.", 404);
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof LastAdminError) {
      return apiError("Cannot delete the last admin.", 400);
    }

    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to delete user.", 500);
  }
}

const safeUserColumns = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

class LastAdminError extends Error {
  constructor() {
    super("Last admin is protected.");
    this.name = "LastAdminError";
  }
}

async function countAdminUsers(
  client: Pick<typeof db, "select">,
): Promise<number> {
  const [adminTotal] = await client
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, UserRole.Admin));

  return adminTotal?.value ?? 0;
}

async function parseUserId(context: UserRouteContext) {
  const { id } = await context.params;
  const parsed = userIdSchema.safeParse(id);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid user id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
