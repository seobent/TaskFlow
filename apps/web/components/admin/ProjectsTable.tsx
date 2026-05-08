"use client";

import type { Project } from "@taskflow/shared";
import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type AdminProjectRow = Project & {
  ownerName: string;
};

type ProjectsTableProps = {
  deletingProjectId?: string | null;
  onDeleteProject: (projectId: string) => Promise<void> | void;
  projects: AdminProjectRow[];
};

export function ProjectsTable({
  deletingProjectId = null,
  onDeleteProject,
  projects,
}: ProjectsTableProps) {
  const [projectToDelete, setProjectToDelete] =
    useState<AdminProjectRow | null>(null);

  async function handleConfirmDelete() {
    if (!projectToDelete) {
      return;
    }

    await onDeleteProject(projectToDelete.id);
    setProjectToDelete(null);
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-ink/10 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Projects
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Workspace inventory
          </h2>
        </div>
        <span className="text-sm font-medium text-ink/55">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full border-collapse text-left">
          <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-ink/55">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Owner</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {projects.map((project) => (
              <tr className="align-middle" key={project.id}>
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-ink transition hover:text-mint"
                    href={`/dashboard/projects/${project.id}`}
                  >
                    {project.name}
                  </Link>
                  {project.description ? (
                    <p className="mt-1 max-w-md truncate text-sm text-ink/55">
                      {project.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-sm text-ink/65">
                  {project.ownerName}
                </td>
                <td className="px-5 py-4 text-sm text-ink/65">
                  {formatDate(project.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-berry px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-berry/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingProjectId === project.id}
                    onClick={() => setProjectToDelete(project)}
                    type="button"
                  >
                    {deletingProjectId === project.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        confirmLabel="Delete project"
        description={
          projectToDelete
            ? `Delete "${projectToDelete.name}" and its tasks, comments, and project members? This action cannot be undone.`
            : "Delete this project? This action cannot be undone."
        }
        isConfirming={
          Boolean(projectToDelete) && deletingProjectId === projectToDelete?.id
        }
        isOpen={Boolean(projectToDelete)}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete project"
      />
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
