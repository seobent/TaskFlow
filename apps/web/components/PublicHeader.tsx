import { TASKFLOW_APP_NAME } from "@taskflow/shared";
import Link from "next/link";

import { TaskFlowLogo } from "@/components/TaskFlowLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type PublicHeaderProps = {
  currentPage?: "home" | "login" | "register";
};

export function PublicHeader({ currentPage = "home" }: PublicHeaderProps) {
  return (
    <header className="flex min-h-14 flex-col gap-4 rounded-md border border-ink/10 bg-white/85 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <Link
        aria-label={`${TASKFLOW_APP_NAME} home`}
        className="inline-flex shrink-0 items-center"
        href="/"
      >
        <TaskFlowLogo className="h-11 w-auto" />
      </Link>
      <nav className="flex flex-wrap items-center gap-2">
        {currentPage !== "home" ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-ink/65 transition hover:bg-ink/5 hover:text-ink"
            href="/"
          >
            Home
          </Link>
        ) : null}
        {currentPage !== "login" ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-ink/65 transition hover:bg-ink/5 hover:text-ink"
            href="/login"
          >
            Log in
          </Link>
        ) : null}
        {currentPage !== "register" ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            href="/register"
          >
            Create account
          </Link>
        ) : null}
        <ThemeToggle />
      </nav>
    </header>
  );
}
