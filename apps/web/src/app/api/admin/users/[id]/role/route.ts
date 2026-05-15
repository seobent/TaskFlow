import { idSchema, updateUserRoleInputSchema, UserRole } from "@taskflow/shared";
import { count, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, sanitizeUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { users } = schema;
const userIdSchema = idSchema.uuid("Invalid user id.");

const safeUserSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type AdminUserRoleRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: AdminUserRoleRouteContext,
) {
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
        columns: {
          id: true,
          role: true,
        },
        where: eq(users.id, userId.value),
      });

      if (!existingUser) {
        return null;
      }

      if (
        existingUser.role === UserRole.Admin &&
        parsed.data.role !== UserRole.Admin
      ) {
        const [adminTotal] = await tx
          .select({ value: count() })
          .from(users)
          .where(eq(users.role, UserRole.Admin));

        if ((adminTotal?.value ?? 0) <= 1) {
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

    return apiError("Unable to update user role.", 500);
  }
}

class LastAdminError extends Error {
  constructor() {
    super("Last admin is protected.");
    this.name = "LastAdminError";
  }
}

async function parseUserId(context: AdminUserRoleRouteContext) {
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
