import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {
  type ISODateString,
  type SafeUser,
  UserRole,
  userRoleSchema,
} from "@taskflow/shared";

import { db, schema } from "@/db";

const { users } = schema;

export const AUTH_COOKIE_NAME = "taskflow_token";
export const TOKEN_EXPIRES_IN = "7d";
export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SALT_ROUNDS = 12;

type UserLike = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  passwordHash?: string;
};

export type AuthTokenPayload = {
  userId: string;
  role: UserRole;
  issuedAt?: number;
  expiresAt?: number;
};

export class AuthError extends Error {
  status: number;

  constructor(message = "Authentication required.", status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for authentication");
  }

  return secret;
}

function serializeTimestamp(value: Date | string | null): ISODateString {
  if (!value) {
    throw new Error("User timestamp is missing");
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function readBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");

    if (rawName === name) {
      const value = rawValue.join("=");

      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  };
}

export function getClearAuthCookieOptions() {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(user: Pick<UserLike, "id" | "role">) {
  const role = userRoleSchema.parse(user.role);

  return jwt.sign(
    {
      sub: user.id,
      role,
    },
    getJwtSecret(),
    {
      expiresIn: TOKEN_EXPIRES_IN,
    },
  );
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload === "string") {
      return null;
    }

    const role = userRoleSchema.safeParse(payload.role);

    if (typeof payload.sub !== "string" || !role.success) {
      return null;
    }

    return {
      userId: payload.sub,
      role: role.data,
      issuedAt: readJwtNumber(payload, "iat"),
      expiresAt: readJwtNumber(payload, "exp"),
    };
  } catch {
    return null;
  }
}

export async function getCurrentUserFromToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.userId),
  });

  return user ? sanitizeUser(user) : null;
}

export async function getCurrentUser(request: Request) {
  const token =
    readBearerToken(request.headers.get("authorization")) ??
    readCookie(request.headers.get("cookie"), AUTH_COOKIE_NAME);

  return getCurrentUserFromToken(token);
}

export async function requireAuth(request: Request) {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthError();
  }

  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);

  if (user.role !== UserRole.Admin) {
    throw new AuthError("Admin access required.", 403);
  }

  return user;
}

export function sanitizeUser(user: UserLike): SafeUser {
  const role = userRoleSchema.parse(user.role);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    createdAt: serializeTimestamp(user.createdAt),
    updatedAt: serializeTimestamp(user.updatedAt),
  };
}

function readJwtNumber(payload: JwtPayload, key: "iat" | "exp") {
  const value = payload[key];

  return typeof value === "number" ? value : undefined;
}
