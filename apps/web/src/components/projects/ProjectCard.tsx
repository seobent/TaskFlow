import type { Project } from "@taskflow/shared";
import Link from "next/link";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="flex min-h-56 flex-col rounded-md border border-ink/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-mint/35 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mint">
            Project
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {project.name}
          </h2>
        </div>
        <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/60">
          Active
        </span>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-ink/65">
        {project.description || "No description has been added yet."}
      </p>

      <div className="mt-5 border-t border-ink/10 pt-4">
        <dl className="grid gap-3 text-xs text-ink/55 sm:grid-cols-2">
          <div>
            <dt className="font-semibold uppercase tracking-wide">Updated</dt>
            <dd className="mt-1 text-ink/70">
              {formatProjectDate(project.updatedAt)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide">Created</dt>
            <dd className="mt-1 text-ink/70">
              {formatProjectDate(project.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
        href={`/projects/${project.id}`}
      >
        Open project
      </Link>
    </article>
  );
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
