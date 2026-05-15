import { ProjectMemberRole, type SafeUser, UserRole } from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  AuthError,
  requireAuth as requireAuthenticatedUser,
} from "@/lib/auth";

const { projectMembers, projects, tasks } = schema;

export type ProjectRecord = typeof projects.$inferSelect;
export type TaskRecord = typeof tasks.$inferSelect;

type CurrentUser = Pick<SafeUser, "id" | "role">;

export type ProjectAuthorization = {
  project: ProjectRecord | null;
  membershipRole: ProjectMemberRole | null;
  isProjectOwner: boolean;
  isProjectManager: boolean;
  isProjectParticipant: boolean;
  canView: boolean;
  canManage: boolean;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canDeleteTask: boolean;
  canAccess: boolean;
  canManageMembers: boolean;
};

export type TaskAuthorization = {
  task: TaskRecord | null;
  project: ProjectRecord | null;
  projectAuthorization: ProjectAuthorization | null;
  isProjectParticipant: boolean;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAccess: boolean;
};

export async function requireAuth(request: Request) {
  return requireAuthenticatedUser(request);
}

export async function requireAdmin(request: Request) {
  const user = await requireAuth(request);

  if (!canManageUsers(user)) {
    throw new AuthError("Admin access required.", 403);
  }

  return user;
}

export function isAdmin(currentUser: CurrentUser) {
  return currentUser.role === UserRole.Admin;
}

export function isManager(currentUser: CurrentUser) {
  return currentUser.role === UserRole.Manager;
}

export function isUser(currentUser: CurrentUser) {
  return currentUser.role === UserRole.User;
}

export function canManageUsers(currentUser: CurrentUser) {
  return isAdmin(currentUser);
}

export function canCreateProject(currentUser: CurrentUser) {
  return isAdmin(currentUser) || isManager(currentUser);
}

export async function canAccessProject(
  currentUser: CurrentUser,
  projectId: string,
) {
  return canViewProject(currentUser, projectId);
}

export async function canViewProject(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canView;
}

export async function canManageProject(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canManage;
}

export async function canCreateTask(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canCreateTask;
}

export async function canManageProjectMembers(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canManageMembers;
}

export function hasGlobalManagerAccess(currentUser: CurrentUser) {
  return canCreateProject(currentUser);
}

export async function canAccessTask(currentUser: CurrentUser, taskId: string) {
  const task = await db.query.tasks.findFirst({
    columns: {
      projectId: true,
    },
    where: eq(tasks.id, taskId),
  });

  if (!task?.projectId) {
    return false;
  }

  return canAccessProject(currentUser, task.projectId);
}

export async function canUpdateTask(currentUser: CurrentUser, taskId: string) {
  const authorization = await getTaskAuthorization(currentUser, taskId);

  return authorization.canUpdate;
}

export async function canDeleteTask(currentUser: CurrentUser, taskId: string) {
  const authorization = await getTaskAuthorization(currentUser, taskId);

  return authorization.canDelete;
}

export async function getProjectAuthorization(
  currentUser: CurrentUser,
  projectId: string,
): Promise<ProjectAuthorization> {
  const [accessRecord] = await db
    .select({
      project: projects,
      membershipId: projectMembers.id,
      membershipRole: projectMembers.role,
    })
    .from(projects)
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, currentUser.id),
      ),
    )
    .where(eq(projects.id, projectId))
    .limit(1);

  const project = accessRecord?.project ?? null;

  if (!project) {
    return {
      project: null,
      membershipRole: null,
      isProjectOwner: false,
      isProjectManager: false,
      isProjectParticipant: false,
      canView: false,
      canManage: false,
      canCreateTask: false,
      canUpdateTask: false,
      canDeleteTask: false,
      canAccess: false,
      canManageMembers: false,
    };
  }

  const admin = isAdmin(currentUser);
  const manager = isManager(currentUser);
  const membershipRole = readProjectMemberRole(accessRecord.membershipRole);
  const projectOwner =
    project.ownerId === currentUser.id ||
    membershipRole === ProjectMemberRole.Owner;
  const projectManager =
    projectOwner || membershipRole === ProjectMemberRole.Manager;
  const isProjectMember = Boolean(accessRecord.membershipId);
  const isProjectParticipant = projectOwner || isProjectMember;
  const canView = admin || (manager ? isProjectParticipant : isProjectMember);
  const canManage = admin || (manager && projectManager);
  const canCreateTask = admin || (manager && projectManager);
  const canUpdateTask =
    admin || (manager ? projectManager : isProjectMember);
  const canDeleteTask = canManage;

  return {
    project,
    membershipRole,
    isProjectOwner: projectOwner,
    isProjectManager: projectManager,
    isProjectParticipant,
    canView,
    canManage,
    canCreateTask,
    canUpdateTask,
    canDeleteTask,
    canAccess: canView,
    canManageMembers: canManage,
  };
}

export async function getTaskAuthorization(
  currentUser: CurrentUser,
  taskId: string,
): Promise<TaskAuthorization> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task?.projectId) {
    return {
      task: task ?? null,
      project: null,
      projectAuthorization: null,
      isProjectParticipant: false,
      canView: false,
      canUpdate: false,
      canDelete: false,
      canAccess: false,
    };
  }

  const projectAuthorization = await getProjectAuthorization(
    currentUser,
    task.projectId,
  );

  return {
    task,
    project: projectAuthorization.project,
    projectAuthorization,
    isProjectParticipant: projectAuthorization.isProjectParticipant,
    canView: projectAuthorization.canView,
    canUpdate: projectAuthorization.canUpdateTask,
    canDelete: projectAuthorization.canDeleteTask,
    canAccess: projectAuthorization.canView,
  };
}

export async function isProjectParticipant(
  project: ProjectRecord,
  userId: string,
) {
  if (project.ownerId === userId) {
    return true;
  }

  const membership = await db.query.projectMembers.findFirst({
    columns: {
      id: true,
    },
    where: and(
      eq(projectMembers.projectId, project.id),
      eq(projectMembers.userId, userId),
    ),
  });

  return Boolean(membership);
}

function readProjectMemberRole(role: string | null): ProjectMemberRole | null {
  if (
    role === ProjectMemberRole.Owner ||
    role === ProjectMemberRole.Manager ||
    role === ProjectMemberRole.Member
  ) {
    return role;
  }

  return null;
}
