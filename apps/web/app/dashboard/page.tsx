import type { Metadata } from "next";
import type { SafeUser } from "@taskflow/shared";

import { requireDashboardUser } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | TaskFlow",
};

const summaryCards = [
  { label: "Active projects", value: "0", tone: "text-mint" },
  { label: "Open issues", value: "0", tone: "text-amber" },
  { label: "Team members", value: "1", tone: "text-berry" },
];

const lanes = ["Backlog", "In progress", "Review", "Done"];

export default async function DashboardPage() {
  const user = await requireDashboardUser();

  return <DashboardContent user={user} />;
}

function DashboardContent({ user }: { user: SafeUser }) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-mint">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Welcome back, {firstName}
            </h1>
          </div>
          <div className="rounded-md border border-ink/10 bg-surface px-4 py-3 text-sm text-ink/65">
            Signed in as <span className="font-semibold text-ink">{user.email}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            className="rounded-md border border-ink/10 bg-white p-5 shadow-sm"
            key={card.label}
          >
            <p className="text-sm font-medium text-ink/55">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
              {card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <h2 className="text-lg font-semibold text-ink">Issue board</h2>
            <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
              Empty workspace
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {lanes.map((lane) => (
              <article
                className="min-h-52 rounded-md border border-dashed border-ink/15 bg-surface p-3"
                key={lane}
              >
                <h3 className="text-sm font-semibold text-ink">{lane}</h3>
                <div className="mt-4 rounded border border-ink/10 bg-white px-3 py-4 text-sm text-ink/50">
                  No issues yet
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">
              Account
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-mint/10 text-lg font-semibold text-mint">
                {user.name.trim().charAt(0).toUpperCase() || "T"}
              </div>
              <div>
                <p className="font-semibold text-ink">{user.name}</p>
                <p className="text-sm capitalize text-ink/55">{user.role}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">
              Next up
            </h2>
            <div className="mt-4 rounded border border-dashed border-ink/15 bg-surface px-3 py-4 text-sm text-ink/55">
              Project and issue data will appear here once APIs are connected.
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
