"use client";

import type { SafeUser } from "@taskflow/shared";
import { TASKFLOW_APP_NAME } from "@taskflow/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { TaskFlowLogo } from "@/components/TaskFlowLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type NavbarProps = {
  user: SafeUser;
};

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setError(null);
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        credentials: "include",
        method: "POST",
      });

      if (!response.ok) {
        setError("Unable to sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-ink/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          aria-label={`${TASKFLOW_APP_NAME} dashboard`}
          className="inline-flex shrink-0 items-center"
          href="/dashboard"
        >
          <TaskFlowLogo className="h-11 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs capitalize text-ink/55">{user.role}</p>
          </div>
          {error ? (
            <p className="hidden text-sm font-medium text-berry md:block">
              {error}
            </p>
          ) : null}
          <Button
            isLoading={isLoggingOut}
            loadingLabel="Signing out..."
            onClick={handleLogout}
            size="sm"
            variant="secondary"
          >
            Logout
          </Button>
          <ThemeToggle />
        </div>
      </div>
      {error ? (
        <div
          className="border-t border-berry/20 bg-berry/10 px-5 py-2 text-sm font-medium text-berry md:hidden"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </header>
  );
}
