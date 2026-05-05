import {
  AUTH_COOKIE_NAME,
  getClearAuthCookieOptions,
} from "@/lib/auth";
import { apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = apiSuccess({ ok: true });

  response.cookies.set(AUTH_COOKIE_NAME, "", getClearAuthCookieOptions());

  return response;
}
