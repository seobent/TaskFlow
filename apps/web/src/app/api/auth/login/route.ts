import { loginInputSchema } from "@taskflow/shared";
import { sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  sanitizeUser,
  signToken,
  verifyPassword,
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

  const parsed = loginInputSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const email = parsed.data.email.toLowerCase();
  const userRecord = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (!userRecord) {
    return apiError("Invalid email or password.", 401);
  }

  const passwordIsValid = await verifyPassword(
    parsed.data.password,
    userRecord.passwordHash,
  );

  if (!passwordIsValid) {
    return apiError("Invalid email or password.", 401);
  }

  const user = sanitizeUser(userRecord);
  const token = signToken(user);
  const response = apiSuccess({ user, token });

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return response;
}
