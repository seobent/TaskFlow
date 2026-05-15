"use client";

import type { SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AdminRequestError,
  fetchAdminResource,
} from "@/components/admin/admin-requests";
import { UsersTable } from "@/components/admin/UsersTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";

type UserManagementPanelProps = {
  currentUser: SafeUser;
};

export function UserManagementPanel({ currentUser }: UserManagementPanelProps) {
  const router = useRouter();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setError(null);
      setIsLoading(true);

      try {
        const payload = await fetchAdminResource<{ users: SafeUser[] }>(
          "/api/admin/users",
          {
            signal: controller.signal,
          },
        );

        setUsers(payload.users);
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

    loadUsers();

    return () => {
      controller.abort();
    };
  }, [reloadToken, router]);

  async function handleRoleChange(userId: string, role: UserRole) {
    const existingUser = users.find((user) => user.id === userId);

    if (!existingUser || existingUser.role === role) {
      return;
    }

    setError(null);
    setSuccess(null);
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

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId ? payload.user : user,
        ),
      );
      setSuccess(
        `${payload.user.name}'s role was updated to ${payload.user.role}.`,
      );
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

  async function handleDeleteUser(userId: string) {
    const existingUser = users.find((user) => user.id === userId);

    if (!existingUser) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingUserId(userId);

    try {
      await fetchAdminResource<{ ok: boolean }>(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId),
      );
      setSuccess(`${existingUser.name}'s account was deleted.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof AdminRequestError
          ? deleteError.message
          : "Unable to delete user.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  if (error && users.length === 0) {
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
        title="Users could not be loaded"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div
          className="rounded-md border border-berry/20 bg-berry/10 px-4 py-3 text-sm font-medium text-berry"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          className="rounded-md border border-mint/25 bg-mint/10 px-4 py-3 text-sm font-medium text-ink"
          role="status"
        >
          {success}
        </div>
      ) : null}

      <UsersTable
        currentUserId={currentUser.id}
        deletingUserId={deletingUserId}
        onDeleteUser={handleDeleteUser}
        onRoleChange={handleRoleChange}
        updatingUserId={updatingUserId}
        users={users}
      />
    </div>
  );
}
