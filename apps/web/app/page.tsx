import { TASKFLOW_APP_NAME } from "@taskflow/shared";

const workspaceStats = [
  { label: "Projects", value: "0", tone: "border-mint text-mint" },
  { label: "Issues", value: "0", tone: "border-amber text-amber" },
  { label: "Teams", value: "0", tone: "border-berry text-berry" }
];

const lanes = ["Backlog", "In progress", "Review", "Done"];

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-mint">
              Capstone Workspace
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-ink sm:text-5xl">
              {TASKFLOW_APP_NAME}
            </h1>
          </div>
          <div className="rounded-md border border-ink/10 bg-white/70 px-4 py-3 text-sm text-ink/70 shadow-sm">
            Web and API scaffold ready
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {workspaceStats.map((item) => (
            <article
              key={item.label}
              className={`rounded-md border-l-4 bg-white p-5 shadow-sm ${item.tone}`}
            >
              <p className="text-sm font-medium text-ink/60">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-ink">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
            <nav className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
              {["Dashboard", "Projects", "Issues", "Teams"].map((item, index) => (
                <span
                  key={item}
                  className={`whitespace-nowrap rounded px-3 py-2 text-sm font-medium ${
                    index === 0
                      ? "bg-ink text-white"
                      : "bg-surface text-ink/70"
                  }`}
                >
                  {item}
                </span>
              ))}
            </nav>
          </aside>

          <div className="grid gap-4 md:grid-cols-4">
            {lanes.map((lane) => (
              <article
                key={lane}
                className="min-h-40 rounded-md border border-dashed border-ink/20 bg-white/80 p-4 shadow-sm"
              >
                <h2 className="text-sm font-semibold text-ink">{lane}</h2>
                <div className="mt-4 rounded border border-ink/10 bg-surface px-3 py-4 text-sm text-ink/60">
                  Empty
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
