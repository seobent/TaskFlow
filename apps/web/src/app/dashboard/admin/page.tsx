import { UserRole } from "@taskflow/shared";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPanel } from "@/components/admin/AdminPanel";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | TaskFlow",
};

export default async function AdminPage() {
  const user = await requireDashboardUser();

  if (user.role !== UserRole.Admin) {
    return (
      <div className="space-y-6">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-berry">
            Forbidden
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            Admin access required
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            This workspace is reserved for TaskFlow admins. Return to your
            dashboard to continue with projects and tasks available to your
            account.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            System overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
            Monitor TaskFlow totals, manage account roles, and remove projects
            that should no longer stay in the workspace.
          </p>
        </div>
      </section>

      <AdminPanel />
    </div>
  );
}
