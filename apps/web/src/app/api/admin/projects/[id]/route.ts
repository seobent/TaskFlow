import { idSchema } from "@taskflow/shared";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { projects } = schema;
const projectIdSchema = idSchema.uuid("Invalid project id.");

type AdminProjectRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: AdminProjectRouteContext,
) {
  try {
    await requireAdmin(request);
    const projectId = await parseProjectId(context);

    if (!projectId.ok) {
      return projectId.response;
    }

    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, projectId.value))
      .returning({ id: projects.id });

    if (!deletedProject) {
      return apiError("Project not found.", 404);
    }

    return apiSuccess({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to delete admin project.", 500);
  }
}

async function parseProjectId(context: AdminProjectRouteContext) {
  const { id } = await context.params;
  const parsed = projectIdSchema.safeParse(id);

  if (!parsed.success) {
    return {
      ok: false as const,
      response: apiError("Invalid project id.", 400, parsed.error.flatten()),
    };
  }

  return {
    ok: true as const,
    value: parsed.data,
  };
}
