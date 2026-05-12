import {
  type ISODateString,
  type Project,
  type SafeUser,
  UserRole,
} from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";

const { projectMembers, projects } = schema;

export type ProjectRecord = typeof projects.$inferSelect;

export type ProjectAccess = {
  project: ProjectRecord | null;
  canView: boolean;
  canManage: boolean;
};

export function serializeProject(project: ProjectRecord): Project {
  if (!project.ownerId) {
    throw new Error("Project owner is missing.");
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    createdAt: serializeTimestamp(project.createdAt),
    updatedAt: serializeTimestamp(project.updatedAt),
  };
}

export async function findProjectAccess(
  projectId: string,
  user: SafeUser,
): Promise<ProjectAccess> {
  const [accessRecord] = await db
    .select({
      project: projects,
      membershipId: projectMembers.id,
    })
    .from(projects)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, user.id),
      ),
    )
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = accessRecord?.project ?? null;

  if (!project) {
    return {
      project: null,
      canView: false,
      canManage: false,
    };
  }

  if (user.role === UserRole.Admin) {
    return {
      project,
      canView: true,
      canManage: true,
    };
  }

  const canManage = project.ownerId === user.id;

  if (canManage) {
    return {
      project,
      canView: true,
      canManage: true,
    };
  }

  return {
    project,
    canView: Boolean(accessRecord.membershipId),
    canManage: false,
  };
}

function serializeTimestamp(value: Date | string | null): ISODateString {
  if (!value) {
    throw new Error("Project timestamp is missing.");
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
