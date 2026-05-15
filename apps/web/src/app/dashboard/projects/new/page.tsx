import type { Metadata } from "next";
import Link from "next/link";
import { UserRole } from "@taskflow/shared";

import { NewProjectView } from "@/components/projects/NewProjectView";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const metadata: Metadata = {
  title: "New Project | TaskFlow",
};

export default async function NewProjectPage() {
  const user = await requireDashboardUser();

  if (user.role !== UserRole.Admin && user.role !== UserRole.Manager) {
    return (
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            href="/dashboard/projects"
          >
            Back to projects
          </Link>
        }
        description="Project creation is available to admins and managers."
        title="Project creation unavailable"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-mint">
          New project
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Create a project
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Give the project a clear name and enough context for the team to
          understand what belongs here.
        </p>
      </section>

      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <NewProjectView />
      </section>
    </div>
  );
}
