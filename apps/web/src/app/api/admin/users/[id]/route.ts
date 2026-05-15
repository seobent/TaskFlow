import { idSchema, UserRole } from "@taskflow/shared";
import { count, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { attachments, comments, projectMembers, projects, tasks, users } = schema;
const userIdSchema = idSchema.uuid("Invalid user id.");

type AdminUserRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: AdminUserRouteContext) {
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
        const [adminTotal] = await tx
          .select({ value: count() })
          .from(users)
          .where(eq(users.role, UserRole.Admin));

        if ((adminTotal?.value ?? 0) <= 1) {
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

    return apiError("Unable to delete admin user.", 500);
  }
}

class LastAdminError extends Error {
  constructor() {
    super("Last admin is protected.");
    this.name = "LastAdminError";
  }
}

async function parseUserId(context: AdminUserRouteContext) {
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
