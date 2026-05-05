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
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

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

  const membership = await db.query.projectMembers.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, user.id),
    ),
  });

  return {
    project,
    canView: Boolean(membership),
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
