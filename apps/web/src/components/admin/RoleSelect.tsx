"use client";

import { UserRole } from "@taskflow/shared";

type RoleSelectProps = {
  disabled?: boolean;
  disabledRoles?: UserRole[];
  isUpdating?: boolean;
  onChange: (role: UserRole) => void;
  value: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Manager]: "Manager",
  [UserRole.User]: "User",
};

export function RoleSelect({
  disabled = false,
  disabledRoles = [],
  isUpdating = false,
  onChange,
  value,
}: RoleSelectProps) {
  const disabledRoleSet = new Set(disabledRoles);

  return (
    <label className="block">
      <span className="sr-only">Change user role</span>
      <select
        className="min-h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold capitalize text-ink shadow-sm transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
        disabled={disabled || isUpdating}
        onChange={(event) => onChange(event.target.value as UserRole)}
        value={value}
      >
        {Object.values(UserRole).map((role) => (
          <option disabled={disabledRoleSet.has(role)} key={role} value={role}>
            {roleLabels[role]}
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
