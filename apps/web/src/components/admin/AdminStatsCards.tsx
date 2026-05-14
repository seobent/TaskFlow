export type AdminStats = {
  totalComments: number;
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
};

type AdminStatsCardsProps = {
  stats: AdminStats;
};

const cards: Array<{
  key: keyof AdminStats;
  label: string;
  tone: string;
}> = [
  { key: "totalUsers", label: "Total users", tone: "text-mint" },
  { key: "totalProjects", label: "Total projects", tone: "text-amber" },
  { key: "totalTasks", label: "Total tasks", tone: "text-berry" },
  { key: "totalComments", label: "Total comments", tone: "text-ink" },
];

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          className="rounded-md border border-ink/10 bg-white p-5 shadow-sm"
          key={card.key}
        >
          <p className="text-sm font-medium text-ink/55">{card.label}</p>
          <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>
            {formatCount(stats[card.key])}
          </p>
        </article>
      ))}
    </section>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en").format(value);
}
