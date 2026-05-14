import {
  type ISODateString,
  type Project,
  type SafeUser,
} from "@taskflow/shared";

import { schema } from "@/db";
import { getProjectAuthorization } from "@/lib/authorization";

const { projects } = schema;

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
  const authorization = await getProjectAuthorization(user, projectId);
  const project = authorization.project;

  if (!project) {
    return {
      project: null,
      canView: false,
      canManage: false,
    };
  }

  return {
    project,
    canView: authorization.canAccess,
    canManage: authorization.canManageMembers,
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
