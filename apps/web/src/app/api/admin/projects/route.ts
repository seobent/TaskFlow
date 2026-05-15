import { desc } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";
import { serializeProject } from "@/lib/projects";

const { projects } = schema;

const projectSelection = {
  id: projects.id,
  name: projects.name,
  description: projects.description,
  ownerId: projects.ownerId,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const projectRecords = await db
      .select(projectSelection)
      .from(projects)
      .orderBy(desc(projects.updatedAt), desc(projects.createdAt));

    return apiSuccess({
      projects: projectRecords.map(serializeProject),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load admin projects.", 500);
  }
}
