"use client";

import type { SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import { useState } from "react";

import { RoleSelect } from "@/components/admin/RoleSelect";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type UsersTableProps = {
  currentUserId: string;
  deletingUserId?: string | null;
  onDeleteUser: (userId: string) => Promise<void> | void;
  onRoleChange: (userId: string, role: UserRole) => void;
  updatingUserId?: string | null;
  users: SafeUser[];
};

export function UsersTable({
  currentUserId,
  deletingUserId = null,
  onDeleteUser,
  onRoleChange,
  updatingUserId = null,
  users,
}: UsersTableProps) {
  const [userToDelete, setUserToDelete] = useState<SafeUser | null>(null);
  const adminCount = users.filter((user) => user.role === UserRole.Admin).length;

  async function handleConfirmDelete() {
    if (!userToDelete) {
      return;
    }

    await onDeleteUser(userToDelete.id);
    setUserToDelete(null);
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-ink/10 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Users
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Account access
          </h2>
        </div>
        <span className="text-sm font-medium text-ink/55">
          {users.length} {users.length === 1 ? "user" : "users"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left">
          <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-ink/55">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isLastAdmin =
                user.role === UserRole.Admin && adminCount <= 1;
              const disabledDeleteReason = isCurrentUser
                ? "Admins cannot delete their own account."
                : isLastAdmin
                  ? "The last admin cannot be deleted."
                  : null;

              return (
                <tr className="align-middle" key={user.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{user.name}</p>
                    {isCurrentUser ? (
                      <p className="mt-1 text-xs font-medium text-mint">
                        Current admin
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink/65">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded bg-ink/5 px-2 py-1 text-xs font-semibold capitalize text-ink/65">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink/65">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <RoleSelect
                        disabled={deletingUserId === user.id}
                        disabledRoles={
                          isLastAdmin
                            ? [UserRole.Manager, UserRole.User]
                            : undefined
                        }
                        isUpdating={updatingUserId === user.id}
                        onChange={(role) => onRoleChange(user.id, role)}
                        value={user.role}
                      />
                      <Button
                        disabled={Boolean(disabledDeleteReason)}
                        isLoading={deletingUserId === user.id}
                        loadingLabel="Deleting..."
                        onClick={() => setUserToDelete(user)}
                        size="sm"
                        title={disabledDeleteReason ?? undefined}
                        type="button"
                        variant="danger"
                      >
                        Delete
                      </Button>
                    </div>
                    {disabledDeleteReason ? (
                      <p className="mt-1 max-w-56 text-xs font-medium text-ink/50">
                        {disabledDeleteReason}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        confirmLabel="Delete user"
        description={
          userToDelete
            ? `Delete ${userToDelete.name}'s account? Their project memberships will be removed and existing project, task, comment, and attachment references will be cleared.`
            : "Delete this user account?"
        }
        isConfirming={
          Boolean(userToDelete) && deletingUserId === userToDelete?.id
        }
        isOpen={Boolean(userToDelete)}
        onCancel={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete user"
      />
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
