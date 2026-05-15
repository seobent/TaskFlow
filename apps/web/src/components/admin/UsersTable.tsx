"use client";

import type { SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import { useEffect, useMemo, useState } from "react";

import { RoleSelect } from "@/components/admin/RoleSelect";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextInput } from "@/components/ui/TextInput";

type UsersTableProps = {
  currentUserId: string;
  deletingUserId?: string | null;
  onDeleteUser: (userId: string) => Promise<void> | void;
  onRoleChange: (userId: string, role: UserRole) => void;
  updatingUserId?: string | null;
  users: SafeUser[];
};

const DEFAULT_USERS_PER_PAGE = 10;
const USERS_PER_PAGE_OPTIONS = [5, 10];

export function UsersTable({
  currentUserId,
  deletingUserId = null,
  onDeleteUser,
  onRoleChange,
  updatingUserId = null,
  users,
}: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_USERS_PER_PAGE);
  const [userToDelete, setUserToDelete] = useState<SafeUser | null>(null);
  const adminCount = users.filter((user) => user.role === UserRole.Admin).length;
  const normalizedFilter = nameFilter.trim().toLocaleLowerCase();
  const isFilterActive = normalizedFilter.length >= 3;
  const matchingUsers = useMemo(() => {
    if (!isFilterActive) {
      return users;
    }

    return users.filter((user) =>
      user.name.toLocaleLowerCase().startsWith(normalizedFilter),
    );
  }, [isFilterActive, normalizedFilter, users]);

  const suggestedUsers = useMemo(() => {
    if (!isFilterActive) {
      return [];
    }

    return users
      .filter((user) =>
        user.name.toLocaleLowerCase().startsWith(normalizedFilter),
      )
      .slice(0, 8);
  }, [isFilterActive, normalizedFilter, users]);
  const pageCount = Math.max(
    1,
    Math.ceil(matchingUsers.length / pageSize),
  );
  const activePage = Math.min(currentPage, pageCount);
  const paginatedUsers = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;

    return matchingUsers.slice(startIndex, startIndex + pageSize);
  }, [activePage, matchingUsers, pageSize]);
  const visiblePages = useMemo(() => {
    const visiblePageCount = Math.min(pageCount, 6);
    const firstPage = Math.min(
      Math.max(1, activePage - Math.floor(visiblePageCount / 2)),
      Math.max(1, pageCount - visiblePageCount + 1),
    );

    return Array.from(
      { length: visiblePageCount },
      (_, index) => firstPage + index,
    );
  }, [activePage, pageCount]);
  const firstVisibleUser = matchingUsers.length
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisibleUser = Math.min(
    activePage * pageSize,
    matchingUsers.length,
  );

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  async function handleConfirmDelete() {
    if (!userToDelete) {
      return;
    }

    await onDeleteUser(userToDelete.id);
    setUserToDelete(null);
  }

  function handleFilterChange(value: string) {
    setNameFilter(value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setCurrentPage(1);
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="space-y-4 border-b border-ink/10 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-mint">
              Account access
            </h2>
          </div>
          <span className="text-sm font-medium text-ink/55 sm:text-right">
            {isFilterActive ? `${matchingUsers.length} of ` : ""}
            {users.length} {users.length === 1 ? "user" : "users"}
          </span>
        </div>
        <div>
          <TextInput
            autoComplete="off"
            className="w-full"
            label="User filter"
            list="admin-user-name-suggestions"
            name="admin-user-name-filter"
            onChange={(event) => handleFilterChange(event.target.value)}
            placeholder="Type first 3 letters"
            type="search"
            value={nameFilter}
          />
          <datalist id="admin-user-name-suggestions">
            {suggestedUsers.map((user) => (
              <option key={user.id} value={user.name} />
            ))}
          </datalist>
        </div>
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
            {paginatedUsers.map((user) => {
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
            {paginatedUsers.length === 0 ? (
              <tr>
                <td
                  className="px-5 py-8 text-center text-sm font-medium text-ink/55"
                  colSpan={5}
                >
                  No users match this name.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 border-t border-ink/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 text-sm font-medium text-ink sm:flex-row sm:items-center">
          <p>
            Showing {firstVisibleUser} to {lastVisibleUser} of{" "}
            {matchingUsers.length} results
          </p>
          <label
            className="flex items-center gap-3 text-ink/70"
            htmlFor="admin-users-page-size"
          >
            Rows per page
            <select
              className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              id="admin-users-page-size"
              onChange={(event) => handlePageSizeChange(event.target.value)}
              value={pageSize}
            >
              {USERS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          aria-label="Users pagination"
          className="flex items-center self-start overflow-hidden rounded-md border border-ink/15 shadow-sm lg:self-auto"
        >
          <button
            className="min-h-10 border-r border-ink/15 bg-white px-4 text-sm font-semibold text-ink/65 transition hover:bg-surface disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-white"
            disabled={activePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            type="button"
          >
            Previous
          </button>
          {visiblePages.map((page) => {
            const isActivePage = page === activePage;

            return (
              <button
                aria-current={isActivePage ? "page" : undefined}
                className={[
                  "min-h-10 min-w-11 border-r border-ink/15 bg-white px-3 text-sm font-semibold transition hover:bg-surface",
                  isActivePage
                    ? "border-ink text-blue-600 ring-1 ring-inset ring-ink"
                    : "text-ink/65",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            );
          })}
          <button
            className="min-h-10 bg-white px-4 text-sm font-semibold text-ink/65 transition hover:bg-surface disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-white"
            disabled={activePage >= pageCount}
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
            type="button"
          >
            Next
          </button>
        </div>
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
