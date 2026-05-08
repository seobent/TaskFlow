import type { SafeUser } from "@taskflow/shared";

export function formatTaskDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTaskDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatUserReference(
  userId: string | null,
  currentUser: SafeUser,
) {
  if (!userId) {
    return "Unassigned";
  }

  if (userId === currentUser.id) {
    return currentUser.name || "You";
  }

  return `User ${shortId(userId)}`;
}

function shortId(value: string) {
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
}
