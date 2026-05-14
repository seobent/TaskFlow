const columns = [
  {
    name: "Backlog",
    tasks: ["API contract review", "Mobile auth QA"],
  },
  {
    name: "In progress",
    tasks: ["Sprint board polish", "Project permissions"],
  },
  {
    name: "Review",
    tasks: ["Login redirect flow"],
  },
];

export function AuthShowcase() {
  return (
    <section className="hidden lg:block">
      <div className="mb-8 max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-wider text-mint">
          Team workspace
        </p>
        <h2 className="mt-3 text-5xl font-semibold leading-tight text-ink">
          Plan, assign, and ship with focus.
        </h2>
      </div>

      <div className="grid max-w-2xl gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Open issues", "24", "text-mint"],
            ["Due this week", "7", "text-amber"],
            ["Blocked", "2", "text-berry"],
          ].map(([label, value, tone]) => (
            <div
              className="rounded-md border border-ink/10 bg-white/80 p-4 shadow-sm"
              key={label}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-ink/45">
                {label}
              </p>
              <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-md border border-ink/10 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Current sprint</p>
            <span className="rounded bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
              Healthy
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {columns.map((column) => (
              <div
                className="min-h-44 rounded-md border border-dashed border-ink/15 bg-surface p-3"
                key={column.name}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
                  {column.name}
                </p>
                <div className="mt-3 space-y-2">
                  {column.tasks.map((task) => (
                    <div
                      className="rounded border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm"
                      key={task}
                    >
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
