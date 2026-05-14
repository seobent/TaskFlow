import { apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

export function GET() {
  return apiSuccess({
    ok: true,
    service: "taskflow-web",
    version: "0.1.0",
  });
}
