import type { Metadata } from "next";

import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile | TaskFlow",
};

export default async function ProfilePage() {
  const user = await requireDashboardUser();

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-mint">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Account settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>
        </p>
      </section>

      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <div className="max-w-xl">
          <h2 className="text-lg font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Enter your current password before choosing a new one.
          </p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
        </div>
      </section>
    </div>
  );
}
