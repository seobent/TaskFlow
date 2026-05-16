"use client";

import type { Project, SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm";
import { ProjectMembersView } from "@/components/projects/ProjectMembersView";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type ProjectDetailsViewProps = {
  currentUser: SafeUser;
  projectId: string;
};

type ProjectWithOwner = Project & {
  owner?: SafeUser | null;
  permissions?: {
    canCreateTask: boolean;
    canManage: boolean;
    canManageMembers: boolean;
  };
};

export function ProjectDetailsView({
  currentUser,
  projectId,
}: ProjectDetailsViewProps) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectWithOwner | null>(null);

  const canManage = useMemo(() => {
    if (!project) {
      return false;
    }

    return (
      project.permissions?.canManage ??
      (currentUser.role === UserRole.Admin ||
        project.ownerId === currentUser.id)
    );
  }, [currentUser.id, currentUser.role, project]);

  const canManageMembers = useMemo(() => {
    if (!project) {
      return false;
    }

    return project.permissions?.canManageMembers ?? canManage;
  }, [canManage, project]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProject() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        const body = await readResponseJson(response);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setLoadError(readApiErrorMessage(body, "Unable to load project."));
          return;
        }

        const payload = readApiData<{ project: ProjectWithOwner }>(body);
        setProject(payload?.project ?? null);
      } catch {
        if (!controller.signal.aborted) {
          setLoadError("Unable to reach TaskFlow. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      controller.abort();
    };
  }, [projectId, router]);

  async function handleUpdate(values: ProjectFormValues) {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        body: JSON.stringify(values),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setFormError(readApiErrorMessage(body, "Unable to update project."));
        return;
      }

      const payload = readApiData<{ project: ProjectWithOwner }>(body);

      if (payload?.project) {
        setProject(payload.project);
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setFormError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: "include",
        method: "DELETE",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setDeleteError(readApiErrorMessage(body, "Unable to delete project."));
        setIsDeleteDialogOpen(false);
        return;
      }

      router.replace("/projects");
      router.refresh();
    } catch {
      setDeleteError("Unable to reach TaskFlow. Please try again.");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading project..." />;
  }

  if (loadError || !project) {
    return (
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            href="/projects"
          >
            Back to projects
          </Link>
        }
        description={loadError ?? "This project could not be found."}
        title="Project unavailable"
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
          {isEditing ? (
            <div>
              <div className="mb-5 border-b border-ink/10 pb-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                  Edit project
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-ink">
                  {project.name}
                </h1>
              </div>
              <ProjectForm
                error={formError}
                initialValues={{
                  description: project.description ?? "",
                  name: project.name,
                }}
                isSubmitting={isSubmitting}
                onCancel={() => {
                  setFormError(null);
                  setIsEditing(false);
                }}
                onSubmit={handleUpdate}
                submitLabel="Save changes"
              />
            </div>
          ) : (
            <ProjectOverview
              canManage={canManage}
              deleteError={deleteError}
              onDelete={() => setIsDeleteDialogOpen(true)}
              onEdit={() => {
                setDeleteError(null);
                setIsEditing(true);
              }}
              project={project}
            />
          )}
        </section>

        {canManageMembers ? (
          <ProjectMembersView embedded projectId={projectId} />
        ) : null}

        <TaskBoard currentUser={currentUser} projectId={projectId} />
      </div>

      <ConfirmDialog
        confirmLabel="Delete project"
        description={`Delete "${project.name}" and its related project data. This action cannot be undone.`}
        isConfirming={isDeleting}
        isOpen={isDeleteDialogOpen}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleDelete}
        title="Delete this project?"
      />
    </>
  );
}

function ProjectOverview({
  canManage,
  deleteError,
  onDelete,
  onEdit,
  project,
}: {
  canManage: boolean;
  deleteError: string | null;
  onDelete: () => void;
  onEdit: () => void;
  project: ProjectWithOwner;
}) {
  const ownerName = project.owner?.name ?? "Unknown owner";
  const metadata = [
    { label: "Project ID", value: project.id },
    { label: "Owner", value: ownerName },
    { label: "Created", value: formatProjectDateTime(project.createdAt) },
    { label: "Updated", value: formatProjectDateTime(project.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-mint">
            Project details
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">
            {project.name}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canManage ? (
            <>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                onClick={onEdit}
                type="button"
              >
                Edit
              </button>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-berry px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-berry/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry"
                onClick={onDelete}
                type="button"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {deleteError ? (
        <div
          className="rounded-md border border-berry/25 bg-berry/10 px-3 py-2 text-sm font-medium text-berry"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">
          Description
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">
          {project.description || "No description has been added yet."}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink/55">
          Metadata
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {metadata.map((item) => (
            <div
              className="rounded-md border border-ink/10 bg-surface px-3 py-3"
              key={item.label}
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                {item.label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function formatProjectDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
