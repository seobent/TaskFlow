import { changePasswordInputSchema } from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import {
  AuthError,
  hashPassword,
  requireAuth,
  verifyPassword,
} from "@/lib/auth";

const { users } = schema;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const currentUser = await requireAuth(request);
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = changePasswordInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
    });

    if (!userRecord) {
      return apiError("Authentication required.", 401);
    }

    const passwordIsValid = await verifyPassword(
      parsed.data.currentPassword,
      userRecord.passwordHash,
    );

    if (!passwordIsValid) {
      return apiError("Current password is incorrect.", 400);
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    return apiSuccess({ message: "Password updated." });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to update password.", 500);
  }
}
