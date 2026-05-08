"use client";

import type { SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";

import { RoleSelect } from "@/components/admin/RoleSelect";

type UsersTableProps = {
  onRoleChange: (userId: string, role: UserRole) => void;
  updatingUserId?: string | null;
  users: SafeUser[];
};

export function UsersTable({
  onRoleChange,
  updatingUserId = null,
  users,
}: UsersTableProps) {
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
        <table className="min-w-[760px] w-full border-collapse text-left">
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
            {users.map((user) => (
              <tr className="align-middle" key={user.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink">{user.name}</p>
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
                  <RoleSelect
                    isUpdating={updatingUserId === user.id}
                    onChange={(role) => onRoleChange(user.id, role)}
                    value={user.role}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
