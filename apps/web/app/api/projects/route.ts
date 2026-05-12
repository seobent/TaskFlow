import {
  createProjectInputSchema,
  ProjectMemberRole,
  UserRole,
} from "@taskflow/shared";
import { and, desc, eq, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import { serializeProject } from "@/lib/projects";

const { projectMembers, projects } = schema;

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
    const user = await requireAuth(request);
    const projectRecords =
      user.role === UserRole.Admin
        ? await db
            .select(projectSelection)
            .from(projects)
            .orderBy(desc(projects.updatedAt), desc(projects.createdAt))
        : await db
            .selectDistinct(projectSelection)
            .from(projects)
            .leftJoin(
              projectMembers,
              and(
                eq(projectMembers.projectId, projects.id),
                eq(projectMembers.userId, user.id),
              ),
            )
            .where(
              or(eq(projects.ownerId, user.id), eq(projectMembers.userId, user.id)),
            )
            .orderBy(desc(projects.updatedAt), desc(projects.createdAt));

    return apiSuccess({
      projects: projectRecords.map(serializeProject),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load projects.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createProjectInputSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const project = await db.transaction(async (tx) => {
      const [createdProject] = await tx
        .insert(projects)
        .values({
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          ownerId: user.id,
        })
        .returning();

      if (!createdProject) {
        throw new Error("Project insert returned no row.");
      }

      await tx.insert(projectMembers).values({
        projectId: createdProject.id,
        userId: user.id,
        role: ProjectMemberRole.Owner,
      });

      return createdProject;
    });

    return apiSuccess({ project: serializeProject(project) }, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to create project.", 500);
  }
}
