import { registerInputSchema, UserRole } from "@taskflow/shared";
import { sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  hashPassword,
  sanitizeUser,
  signToken,
} from "@/lib/auth";

const { users } = schema;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const parsed = registerInputSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (existingUser) {
    return apiError("A user with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const [createdUser] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email,
        passwordHash,
        role: UserRole.User,
      })
      .returning();

    if (!createdUser) {
      return apiError("Unable to create user.", 500);
    }

    const user = sanitizeUser(createdUser);
    const token = signToken(user);
    const response = apiSuccess({ user, token }, 201);

    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return response;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return apiError("A user with this email already exists.", 409);
    }

    return apiError("Unable to create user.", 500);
  }
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
