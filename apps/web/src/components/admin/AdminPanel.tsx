"use client";

import type { Project, SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  type AdminStats,
  AdminStatsCards,
} from "@/components/admin/AdminStatsCards";
import {
  type AdminProjectRow,
  ProjectsTable,
} from "@/components/admin/ProjectsTable";
import { UsersTable } from "@/components/admin/UsersTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type AdminPanelData = {
  projects: Project[];
  stats: AdminStats;
  users: SafeUser[];
};

const emptyStats: AdminStats = {
  totalComments: 0,
  totalProjects: 0,
  totalTasks: 0,
  totalUsers: 0,
};

export function AdminPanel() {
  const router = useRouter();
  const [data, setData] = useState<AdminPanelData>({
    projects: [],
    stats: emptyStats,
    users: [],
  });
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAdminData() {
      setError(null);
      setIsLoading(true);

      try {
        const [stats, users, projects] = await Promise.all([
          fetchAdminResource<AdminStats>("/api/admin/stats", {
            signal: controller.signal,
          }),
          fetchAdminResource<{ users: SafeUser[] }>("/api/admin/users", {
            signal: controller.signal,
          }),
          fetchAdminResource<{ projects: Project[] }>("/api/admin/projects", {
            signal: controller.signal,
          }),
        ]);

        setData({
          projects: projects.projects,
          stats,
          users: users.users,
        });
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        if (loadError instanceof AdminRequestError) {
          if (loadError.status === 401) {
            router.replace("/login");
            return;
          }

          setError(loadError.message);
          return;
        }

        setError("Unable to reach TaskFlow. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAdminData();

    return () => {
      controller.abort();
    };
  }, [reloadToken, router]);

  const projectRows = useMemo(
    () => buildProjectRows(data.projects, data.users),
    [data.projects, data.users],
  );

  async function handleRoleChange(userId: string, role: UserRole) {
    const existingUser = data.users.find((user) => user.id === userId);

    if (!existingUser || existingUser.role === role) {
      return;
    }

    setError(null);
    setUpdatingUserId(userId);

    try {
      const payload = await fetchAdminResource<{ user: SafeUser }>(
        `/api/admin/users/${userId}/role`,
        {
          body: JSON.stringify({ role }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      );

      setData((current) => ({
        ...current,
        users: current.users.map((user) =>
          user.id === userId ? payload.user : user,
        ),
      }));
    } catch (roleError) {
      setError(
        roleError instanceof AdminRequestError
          ? roleError.message
          : "Unable to update user role.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteProject(projectId: string) {
    setError(null);
    setDeletingProjectId(projectId);

    try {
      await fetchAdminResource<{ ok: boolean }>(
        `/api/admin/projects/${projectId}`,
        {
          method: "DELETE",
        },
      );
      const stats = await fetchAdminResource<AdminStats>("/api/admin/stats");

      setData((current) => ({
        ...current,
        projects: current.projects.filter((project) => project.id !== projectId),
        stats,
      }));
    } catch (deleteError) {
      setError(
        deleteError instanceof AdminRequestError
          ? deleteError.message
          : "Unable to delete project.",
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading admin dashboard..." />;
  }

  if (error && data.users.length === 0 && data.projects.length === 0) {
    return (
      <EmptyState
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            onClick={() => setReloadToken((token) => token + 1)}
            type="button"
          >
            Retry
          </button>
        }
        description={error}
        title="Admin data could not be loaded"
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          className="rounded-md border border-berry/20 bg-berry/10 px-4 py-3 text-sm font-medium text-berry"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <AdminStatsCards stats={data.stats} />

      <UsersTable
        onRoleChange={handleRoleChange}
        updatingUserId={updatingUserId}
        users={data.users}
      />

      <ProjectsTable
        deletingProjectId={deletingProjectId}
        onDeleteProject={handleDeleteProject}
        projects={projectRows}
      />
    </div>
  );
}

class AdminRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
  }
}

async function fetchAdminResource<TData>(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
  });
  const body = await readResponseJson(response);

  if (!response.ok) {
    throw new AdminRequestError(
      readApiErrorMessage(body, "Unable to load admin data."),
      response.status,
    );
  }

  const payload = readApiData<TData>(body);

  if (!payload) {
    throw new AdminRequestError("Unexpected admin response.", response.status);
  }

  return payload;
}

function buildProjectRows(
  projects: Project[],
  users: SafeUser[],
): AdminProjectRow[] {
  const usersById = new Map(users.map((user) => [user.id, user]));

  return projects.map((project) => ({
    ...project,
    ownerName: usersById.get(project.ownerId)?.name ?? "Unknown owner",
  }));
}
