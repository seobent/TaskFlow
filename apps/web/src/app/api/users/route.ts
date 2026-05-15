import { asc, desc, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { userRoleSchema } from "@taskflow/shared";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { users } = schema;

const userSearchQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

const safeUserSearchSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type UserSearchRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const parsedQuery = userSearchQuerySchema.safeParse({
      search: new URL(request.url).searchParams.get("search") ?? undefined,
    });

    if (!parsedQuery.success) {
      return apiError(
        "Invalid query parameters.",
        400,
        parsedQuery.error.flatten(),
      );
    }

    const search = parsedQuery.data.search;
    const userRecords =
      search && search.length > 0
        ? await db
            .select(safeUserSearchSelection)
            .from(users)
            .where(
              or(
                ilike(users.name, `%${search}%`),
                ilike(users.email, `%${search}%`),
              ),
            )
            .orderBy(asc(users.name), asc(users.email))
        : await db
            .select(safeUserSearchSelection)
            .from(users)
            .orderBy(desc(users.createdAt), asc(users.name), asc(users.email));

    return apiSuccess({
      users: userRecords.map(serializeUserSearchResult),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load users.", 500);
  }
}

function serializeUserSearchResult(user: UserSearchRecord) {
  if (!user.createdAt || !user.updatedAt) {
    throw new Error("User timestamp is missing.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRoleSchema.parse(user.role),
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : new Date(user.createdAt).toISOString(),
    updatedAt:
      user.updatedAt instanceof Date
        ? user.updatedAt.toISOString()
        : new Date(user.updatedAt).toISOString(),
  };
}
