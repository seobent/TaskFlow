import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    return apiSuccess({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load current user.", 500);
  }
}
