import { desc } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError, sanitizeUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { users } = schema;

const safeUserSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const userRecords = await db
      .select(safeUserSelection)
      .from(users)
      .orderBy(desc(users.createdAt));

    return apiSuccess({
      users: userRecords.map(sanitizeUser),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load admin users.", 500);
  }
}
