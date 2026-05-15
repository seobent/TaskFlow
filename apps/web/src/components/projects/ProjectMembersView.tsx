"use client";

import {
  type AssignProjectMemberInput,
  type ProjectMember,
  ProjectMemberRole,
  type SafeUser,
  type UpdateProjectMemberInput,
} from "@taskflow/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type ProjectMemberWithUser = ProjectMember & {
  user?: SafeUser;
};

type ProjectMembersPayload = {
  assignableUsers?: SafeUser[];
  canManage?: boolean;
  members: ProjectMemberWithUser[];
  project?: {
    id: string;
    name: string;
    ownerId: string | null;
  };
};

type ProjectMembersViewProps = {
  embedded?: boolean;
  projectId: string;
};

type AssignableProjectMemberRole =
  | ProjectMemberRole.Member
  | ProjectMemberRole.Manager;

const assignableRoles = [ProjectMemberRole.Member, ProjectMemberRole.Manager];

const projectRoleLabels: Record<ProjectMemberRole, string> = {
  [ProjectMemberRole.Owner]: "Owner",
  [ProjectMemberRole.Manager]: "Manager",
  [ProjectMemberRole.Member]: "Member",
};

export function ProjectMembersView({
  embedded = false,
  projectId,
}: ProjectMembersViewProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState<AssignableProjectMemberRole>(
    ProjectMemberRole.Member,
  );
  const [assignableUsers, setAssignableUsers] = useState<SafeUser[]>([]);
  const [assignSearchResetToken, setAssignSearchResetToken] = useState(0);
  const [canManage, setCanManage] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<ProjectMemberWithUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [members, setMembers] = useState<ProjectMemberWithUser[]>([]);
  const [projectName, setProjectName] = useState("Project");
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      setActionError(null);
      setActionMessage(null);
      setAssignError(null);
      setAssignMessage(null);
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/members`, {
          credentials: "include",
          signal: controller.signal,
        });
        const body = await readResponseJson(response);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setLoadError(
            readProjectMemberApiError(
              response.status,
              body,
              "Unable to load project members.",
            ),
          );
          return;
        }

        const payload = readApiData<ProjectMembersPayload>(body);

        setMembers(
          sortMembers(Array.isArray(payload?.members) ? payload.members : []),
        );
        setAssignableUsers(
          Array.isArray(payload?.assignableUsers)
            ? payload.assignableUsers
            : [],
        );
        setCanManage(Boolean(payload?.canManage));
        setProjectName(payload?.project?.name ?? "Project");
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Unable to reach TaskFlow. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      controller.abort();
    };
  }, [projectId, reloadToken, router]);

  const assignedUserIds = useMemo(
    () => new Set(members.map((member) => member.userId)),
    [members],
  );

  const unassignedUserCount = useMemo(
    () => assignableUsers.filter((user) => !assignedUserIds.has(user.id)).length,
    [assignableUsers, assignedUserIds],
  );

  const selectedUserIsAssigned =
    selectedUserId.length > 0 && assignedUserIds.has(selectedUserId);

  async function handleAssignMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserId) {
      setAssignError("Choose a user to assign.");
      setAssignMessage(null);
      return;
    }

    if (selectedUserIsAssigned) {
      setAssignError("That user is already assigned to this project.");
      setAssignMessage(null);
      return;
    }

    setAssignError(null);
    setAssignMessage(null);
    setActionMessage(null);
    setIsAssigning(true);

    try {
      const input = {
        role: assignRole,
        userId: selectedUserId,
      } satisfies AssignProjectMemberInput;

      const response = await fetch(`/api/projects/${projectId}/members`, {
        body: JSON.stringify(input),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setAssignError(
          readProjectMemberApiError(
            response.status,
            body,
            "Unable to assign project member.",
          ),
        );
        return;
      }

      const payload = readApiData<{ member: ProjectMemberWithUser }>(body);
      const assignedUserName =
        payload?.member?.user?.name ??
        assignableUsers.find((user) => user.id === selectedUserId)?.name ??
        "User";

      if (payload?.member) {
        setMembers((currentMembers) =>
          sortMembers([...currentMembers, payload.member]),
        );
      }

      setAssignMessage(`${assignedUserName} was added to this project.`);
      setSelectedUserId("");
      setAssignRole(ProjectMemberRole.Member);
      setAssignSearchResetToken((token) => token + 1);
      router.refresh();
    } catch {
      setAssignError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRoleChange(
    member: ProjectMemberWithUser,
    role: AssignableProjectMemberRole,
  ) {
    if (member.role === role || member.role === ProjectMemberRole.Owner) {
      return;
    }

    const previousMember = member;

    setActionError(null);
    setActionMessage(null);
    setAssignMessage(null);
    setUpdatingUserId(member.userId);
    setMembers((currentMembers) =>
      currentMembers.map((currentMember) =>
        currentMember.userId === member.userId
          ? {
              ...currentMember,
              role,
              updatedAt: new Date().toISOString(),
            }
          : currentMember,
      ),
    );

    try {
      const input = { role } satisfies UpdateProjectMemberInput;
      const response = await fetch(
        `/api/projects/${projectId}/members/${member.userId}`,
        {
          body: JSON.stringify(input),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        },
      );
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setMembers((currentMembers) =>
          currentMembers.map((currentMember) =>
            currentMember.userId === previousMember.userId
              ? previousMember
              : currentMember,
          ),
        );
        setActionError(
          readProjectMemberApiError(
            response.status,
            body,
            "Unable to update project member role.",
          ),
        );
        return;
      }

      const payload = readApiData<{ member: ProjectMemberWithUser }>(body);

      if (payload?.member) {
        setMembers((currentMembers) =>
          sortMembers(
            currentMembers.map((currentMember) =>
              currentMember.userId === payload.member.userId
                ? payload.member
                : currentMember,
            ),
          ),
        );
      }

      setActionMessage(
        `${member.user?.name ?? "Member"} is now a ${projectRoleLabels[role].toLowerCase()}.`,
      );
      router.refresh();
    } catch {
      setMembers((currentMembers) =>
        currentMembers.map((currentMember) =>
          currentMember.userId === previousMember.userId
            ? previousMember
            : currentMember,
        ),
      );
      setActionError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRemoveMember() {
    if (!deleteTarget || deleteTarget.role === ProjectMemberRole.Owner) {
      return;
    }

    setActionError(null);
    setActionMessage(null);
    setAssignMessage(null);
    setDeletingUserId(deleteTarget.userId);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/members/${deleteTarget.userId}`,
        {
          credentials: "include",
          method: "DELETE",
        },
      );
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setActionError(
          readProjectMemberApiError(
            response.status,
            body,
            "Unable to remove project member.",
          ),
        );
        setDeleteTarget(null);
        return;
      }

      const removedUserName = deleteTarget.user?.name ?? "Member";
      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member.userId !== deleteTarget.userId,
        ),
      );
      setActionMessage(`${removedUserName} was removed from this project.`);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      setActionError("Unable to reach TaskFlow. Please try again.");
      setDeleteTarget(null);
    } finally {
      setDeletingUserId(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading project members..." />;
  }

  if (loadError) {
    return (
      <EmptyState
        action={
          <Button
            onClick={() => setReloadToken((token) => token + 1)}
            type="button"
            variant="secondary"
          >
            Retry
          </Button>
        }
        description={loadError}
        title="Members could not be loaded"
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {embedded ? (
          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                Project members
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                Manage access
              </h2>
            </div>
          </section>
        ) : (
          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                  Project settings
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-ink">
                  Members
                </h1>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {projectName}
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                href={`/dashboard/projects/${projectId}`}
              >
                Back to project
              </Link>
            </div>
          </section>
        )}

        {canManage ? (
          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <div className="border-b border-ink/10 pb-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                Assignment
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                Add member
              </h2>
            </div>

            <form
              className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto]"
              onSubmit={handleAssignMember}
            >
              <UserSearchSelect
                assignedUserIds={assignedUserIds}
                disabled={isAssigning || unassignedUserCount === 0}
                onChange={setSelectedUserId}
                resetToken={assignSearchResetToken}
                users={assignableUsers}
                value={selectedUserId}
              />

              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-ink"
                  htmlFor="project-member-role"
                >
                  Role
                </label>
                <select
                  className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm font-semibold text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
                  disabled={isAssigning || unassignedUserCount === 0}
                  id="project-member-role"
                  onChange={(event) =>
                    setAssignRole(
                      event.target.value as AssignableProjectMemberRole,
                    )
                  }
                  value={assignRole}
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {projectRoleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full lg:w-auto"
                  disabled={
                    !selectedUserId ||
                    selectedUserIsAssigned ||
                    unassignedUserCount === 0
                  }
                  isLoading={isAssigning}
                  loadingLabel="Assigning..."
                  type="submit"
                >
                  Assign
                </Button>
              </div>
            </form>

            {assignError ? (
              <div
                className="mt-4 rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
                role="alert"
              >
                {assignError}
              </div>
            ) : null}

            {assignMessage ? (
              <div
                className="mt-4 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-sm font-medium text-ink"
                role="status"
              >
                {assignMessage}
              </div>
            ) : null}

            {unassignedUserCount === 0 ? (
              <p className="mt-3 text-sm font-medium text-ink/55">
                All users are already assigned to this project.
              </p>
            ) : null}
          </section>
        ) : (
          <section className="rounded-md border border-ink/10 bg-white p-5 text-sm leading-6 text-ink/65 shadow-sm">
            Project owners, project managers, and admins can add, remove, and
            update member roles. You can view the current member list.
          </section>
        )}

        <ProjectMembersTable
          actionError={actionError}
          actionMessage={actionMessage}
          canManage={canManage}
          deletingUserId={deletingUserId}
          members={members}
          onRemoveMember={setDeleteTarget}
          onRoleChange={handleRoleChange}
          updatingUserId={updatingUserId}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Remove member"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.user?.name ?? "this user"} from ${projectName}? They will lose access to project tasks and comments.`
            : "Remove this member from the project?"
        }
        isConfirming={Boolean(deletingUserId)}
        isOpen={Boolean(deleteTarget)}
        onCancel={() => {
          if (!deletingUserId) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleRemoveMember}
        title="Remove project member?"
      />
    </>
  );
}

function ProjectMembersTable({
  actionError,
  actionMessage,
  canManage,
  deletingUserId,
  members,
  onRemoveMember,
  onRoleChange,
  updatingUserId,
}: {
  actionError: string | null;
  actionMessage: string | null;
  canManage: boolean;
  deletingUserId: string | null;
  members: ProjectMemberWithUser[];
  onRemoveMember: (member: ProjectMemberWithUser) => void;
  onRoleChange: (
    member: ProjectMemberWithUser,
    role: AssignableProjectMemberRole,
  ) => void;
  updatingUserId: string | null;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        description="No users are assigned to this project yet."
        title="No members yet"
      />
    );
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-ink/10 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Team
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Assigned users
          </h2>
        </div>
        <span className="text-sm font-medium text-ink/55">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      {actionError ? (
        <div
          className="mx-5 mt-4 rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
          role="alert"
        >
          {actionError}
        </div>
      ) : null}

      {actionMessage ? (
        <div
          className="mx-5 mt-4 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-sm font-medium text-ink"
          role="status"
        >
          {actionMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-ink/55">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Assigned</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {members.map((member) => {
              const isOwner = member.role === ProjectMemberRole.Owner;
              const isUpdating = updatingUserId === member.userId;
              const isDeleting = deletingUserId === member.userId;

              return (
                <tr className="align-middle" key={member.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">
                      {member.user?.name ?? "Unknown user"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-ink/65">
                    {member.user?.email ?? member.userId}
                  </td>
                  <td className="px-5 py-4">
                    {canManage && !isOwner ? (
                      <RoleSelect
                        disabled={isDeleting}
                        isUpdating={isUpdating}
                        onChange={(role) => onRoleChange(member, role)}
                        value={member.role}
                      />
                    ) : (
                      <span className="inline-flex rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/65">
                        {projectRoleLabels[member.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-ink/65">
                    {formatDate(member.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    {canManage && !isOwner ? (
                      <Button
                        disabled={isUpdating || isDeleting}
                        isLoading={isDeleting}
                        loadingLabel="Removing..."
                        onClick={() => onRemoveMember(member)}
                        size="sm"
                        type="button"
                        variant="danger"
                      >
                        Remove
                      </Button>
                    ) : (
                      <span className="text-sm font-medium text-ink/45">
                        {isOwner ? "Owner cannot be removed" : "View only"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RoleSelect({
  disabled = false,
  isUpdating = false,
  onChange,
  value,
}: {
  disabled?: boolean;
  isUpdating?: boolean;
  onChange: (role: AssignableProjectMemberRole) => void;
  value: ProjectMemberRole;
}) {
  return (
    <label className="block">
      <span className="sr-only">Change project member role</span>
      <select
        className="min-h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
        disabled={disabled || isUpdating}
        onChange={(event) =>
          onChange(event.target.value as AssignableProjectMemberRole)
        }
        value={value}
      >
        {assignableRoles.map((role) => (
          <option key={role} value={role}>
            {projectRoleLabels[role]}
          </option>
        ))}
      </select>
      {isUpdating ? (
        <span className="mt-1 block text-xs font-medium text-ink/50">
          Saving...
        </span>
      ) : null}
    </label>
  );
}

function UserSearchSelect({
  assignedUserIds,
  disabled = false,
  onChange,
  resetToken,
  users,
  value,
}: {
  assignedUserIds: Set<string>;
  disabled?: boolean;
  onChange: (userId: string) => void;
  resetToken: number;
  users: SafeUser[];
  value: string;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedUser = users.find((user) => user.id === value) ?? null;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) {
      return users.slice(0, 20);
    }

    return users
      .filter((user) =>
        `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 20);
  }, [normalizedQuery, users]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setQuery(`${selectedUser.name} · ${selectedUser.email}`);
    }
  }, [selectedUser, value]);

  useEffect(() => {
    setQuery("");
  }, [resetToken]);

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <label className="block text-sm font-medium text-ink" htmlFor="member-user-search">
        User
      </label>
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        className="min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink/50"
        disabled={disabled}
        id="member-user-search"
        onChange={(event) => {
          setQuery(event.target.value);
          onChange("");
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search by name or email"
        role="combobox"
        type="search"
        value={query}
      />
      {isOpen && !disabled ? (
        <div
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-ink/15 bg-white p-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const isAssigned = assignedUserIds.has(user.id);

              return (
                <button
                  className={[
                    "flex w-full items-start justify-between gap-3 rounded px-3 py-2 text-left text-sm transition",
                    isAssigned
                      ? "cursor-not-allowed text-ink/35"
                      : "text-ink hover:bg-surface",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={isAssigned}
                  key={user.id}
                  onClick={() => {
                    onChange(user.id);
                    setQuery(`${user.name} · ${user.email}`);
                    setIsOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span>
                    <span className="block font-semibold">{user.name}</span>
                    <span className="block text-xs text-ink/55">
                      {user.email}
                    </span>
                  </span>
                  {isAssigned ? (
                    <span className="shrink-0 text-xs font-semibold">
                      Assigned
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-ink/55">
              No users match that search.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function sortMembers(members: ProjectMemberWithUser[]) {
  const roleRank: Record<ProjectMemberRole, number> = {
    [ProjectMemberRole.Owner]: 0,
    [ProjectMemberRole.Manager]: 1,
    [ProjectMemberRole.Member]: 2,
  };

  return [...members].sort((first, second) => {
    const roleDifference = roleRank[first.role] - roleRank[second.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return (first.user?.name ?? "").localeCompare(second.user?.name ?? "");
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function readProjectMemberApiError(
  status: number,
  payload: unknown,
  fallback: string,
) {
  const statusFallbacks: Record<number, string> = {
    403: "You do not have permission to manage members for this project.",
    404: "This project or user could not be found.",
    409: "That user is already assigned to this project.",
  };

  return readApiErrorMessage(payload, statusFallbacks[status] ?? fallback);
}
