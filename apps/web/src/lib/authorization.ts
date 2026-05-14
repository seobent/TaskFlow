import { ProjectMemberRole, type SafeUser, UserRole } from "@taskflow/shared";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";

const { projectMembers, projects, tasks } = schema;

export type ProjectRecord = typeof projects.$inferSelect;
export type TaskRecord = typeof tasks.$inferSelect;

type CurrentUser = Pick<SafeUser, "id" | "role">;

export type ProjectAuthorization = {
  project: ProjectRecord | null;
  isProjectParticipant: boolean;
  canAccess: boolean;
  canManageMembers: boolean;
};

export type TaskAuthorization = {
  task: TaskRecord | null;
  project: ProjectRecord | null;
  isProjectParticipant: boolean;
  canAccess: boolean;
};

export async function canAccessProject(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canAccess;
}

export async function canManageProjectMembers(
  currentUser: CurrentUser,
  projectId: string,
) {
  const authorization = await getProjectAuthorization(currentUser, projectId);

  return authorization.canManageMembers;
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
      isProjectParticipant: false,
      canAccess: false,
      canManageMembers: false,
    };
  }

  const isAdmin = currentUser.role === UserRole.Admin;
  const isProjectOwner =
    project.ownerId === currentUser.id ||
    accessRecord.membershipRole === ProjectMemberRole.Owner;
  const isProjectMember = Boolean(accessRecord.membershipId);
  const isProjectParticipant = isProjectOwner || isProjectMember;

  return {
    project,
    isProjectParticipant,
    canAccess: isAdmin || isProjectParticipant,
    canManageMembers: isAdmin || isProjectOwner,
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
      isProjectParticipant: false,
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
    isProjectParticipant: projectAuthorization.isProjectParticipant,
    canAccess: projectAuthorization.canAccess,
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
