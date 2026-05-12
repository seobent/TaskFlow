import {
  type ISODateString,
  type ProjectMember,
  projectMemberRoleSchema,
  type SafeUser,
  UserRole,
} from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { sanitizeUser } from "@/lib/auth";

const { projectMembers, projects, users } = schema;

export type ProjectRecord = typeof projects.$inferSelect;
export type ProjectMemberRecord = typeof projectMembers.$inferSelect;

export type ProjectMemberAccess = {
  project: ProjectRecord | null;
  canList: boolean;
  canManage: boolean;
};

export const safeMemberUserSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type MemberUserRecord = typeof users.$inferSelect;

export function serializeProjectMember(
  member: ProjectMemberRecord,
  user?: Pick<
    MemberUserRecord,
    "id" | "email" | "name" | "role" | "createdAt" | "updatedAt"
  >,
): ProjectMember & { user?: SafeUser } {
  return {
    id: member.id,
    projectId: member.projectId,
    userId: member.userId,
    role: projectMemberRoleSchema.parse(member.role),
    createdAt: serializeTimestamp(member.createdAt),
    updatedAt: serializeTimestamp(member.updatedAt),
    ...(user ? { user: sanitizeUser(user) } : {}),
  };
}

export async function findProjectMemberAccess(
  projectId: string,
  user: SafeUser,
): Promise<ProjectMemberAccess> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return {
      project: null,
      canList: false,
      canManage: false,
    };
  }

  const canManage = user.role === UserRole.Admin || project.ownerId === user.id;

  if (canManage) {
    return {
      project,
      canList: true,
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
    canList: Boolean(membership),
    canManage: false,
  };
}

function serializeTimestamp(value: Date | string | null): ISODateString {
  if (!value) {
    throw new Error("Project member timestamp is missing.");
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}
