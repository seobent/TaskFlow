import type { Metadata } from "next";

import { NewProjectView } from "@/components/projects/NewProjectView";

export const metadata: Metadata = {
  title: "New Project | TaskFlow",
};

export default function NewProjectPage() {
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
