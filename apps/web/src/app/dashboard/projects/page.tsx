import type { Metadata } from "next";
import Link from "next/link";
import { UserRole } from "@taskflow/shared";

import { ProjectListView } from "@/components/projects/ProjectListView";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const metadata: Metadata = {
  title: "Projects | TaskFlow",
};

export default async function ProjectsPage() {
  const user = await requireDashboardUser();
  const canCreateProjects =
    user.role === UserRole.Admin || user.role === UserRole.Manager;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-mint">
              Projects
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Project workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
              Browse every project available to your account and open the work
              that needs attention.
            </p>
          </div>
          {canCreateProjects ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              href="/dashboard/projects/new"
            >
              New project
            </Link>
          ) : null}
        </div>
      </section>

      <ProjectListView
        canCreateProjects={canCreateProjects}
        currentUser={user}
      />
    </div>
  );
}
