import {
  createProjectInputSchema,
  ProjectMemberRole,
} from "@taskflow/shared";
import { and, desc, eq, exists, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess, validationError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/lib/auth";
import { canCreateProject, isAdmin, isManager } from "@/lib/authorization";
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
    const assignedProjectExists = exists(
      db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projects.id),
            eq(projectMembers.userId, user.id),
          ),
        ),
    );
    const visibleProjectFilter = isManager(user)
      ? or(eq(projects.ownerId, user.id), assignedProjectExists)
      : assignedProjectExists;

    const projectRecords = isAdmin(user)
      ? await db
          .select(projectSelection)
          .from(projects)
          .orderBy(desc(projects.updatedAt), desc(projects.createdAt))
      : await db
          .select(projectSelection)
          .from(projects)
          .where(visibleProjectFilter)
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

    if (!canCreateProject(user)) {
      return apiError("Manager access required to create projects.", 403);
    }

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

      const [createdMember] = await tx
        .insert(projectMembers)
        .values({
          projectId: createdProject.id,
          userId: user.id,
          role: isManager(user)
            ? ProjectMemberRole.Manager
            : ProjectMemberRole.Owner,
        })
        .onConflictDoNothing({
          target: [projectMembers.projectId, projectMembers.userId],
        })
        .returning({ id: projectMembers.id });

      if (!createdMember) {
        throw new Error("Project member insert returned no row.");
      }

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
