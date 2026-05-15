"use client";

import type { Project, SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ProjectCard } from "@/components/projects/ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextInput } from "@/components/ui/TextInput";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

type ProjectListViewProps = {
  canCreateProjects: boolean;
  currentUser: SafeUser;
};

const DEFAULT_PROJECTS_PER_PAGE = 6;
const PROJECTS_PER_PAGE_OPTIONS = [6, 12, 18];

export function ProjectListView({
  canCreateProjects,
  currentUser,
}: ProjectListViewProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageSize, setPageSize] = useState(DEFAULT_PROJECTS_PER_PAGE);
  const [projectFilter, setProjectFilter] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const normalizedFilter = projectFilter.trim().toLocaleLowerCase();
  const isFilterActive = normalizedFilter.length >= 3;
  const matchingProjects = useMemo(() => {
    if (!isFilterActive) {
      return projects;
    }

    return projects.filter((project) =>
      project.name.toLocaleLowerCase().includes(normalizedFilter),
    );
  }, [isFilterActive, normalizedFilter, projects]);
  const suggestedProjects = useMemo(() => {
    if (!isFilterActive) {
      return [];
    }

    return projects
      .filter((project) =>
        project.name.toLocaleLowerCase().includes(normalizedFilter),
      )
      .slice(0, 8);
  }, [isFilterActive, normalizedFilter, projects]);
  const pageCount = Math.max(
    1,
    Math.ceil(matchingProjects.length / pageSize),
  );
  const activePage = Math.min(currentPage, pageCount);
  const paginatedProjects = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;

    return matchingProjects.slice(startIndex, startIndex + pageSize);
  }, [activePage, matchingProjects, pageSize]);
  const visiblePages = useMemo(() => {
    const visiblePageCount = Math.min(pageCount, 6);
    const firstPage = Math.min(
      Math.max(1, activePage - Math.floor(visiblePageCount / 2)),
      Math.max(1, pageCount - visiblePageCount + 1),
    );

    return Array.from(
      { length: visiblePageCount },
      (_, index) => firstPage + index,
    );
  }, [activePage, pageCount]);
  const firstVisibleProject = matchingProjects.length
    ? (activePage - 1) * pageSize + 1
    : 0;
  const lastVisibleProject = Math.min(
    activePage * pageSize,
    matchingProjects.length,
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadProjects() {
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch("/api/projects", {
          credentials: "include",
          signal: controller.signal,
        });
        const body = await readResponseJson(response);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          setError(readApiErrorMessage(body, "Unable to load projects."));
          return;
        }

        const payload = readApiData<{ projects: Project[] }>(body);
        setProjects(Array.isArray(payload?.projects) ? payload.projects : []);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError("Unable to reach TaskFlow. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      controller.abort();
    };
  }, [reloadToken, router]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  function handleFilterChange(value: string) {
    setProjectFilter(value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setCurrentPage(1);
  }

  if (isLoading) {
    return <LoadingState label="Loading projects..." />;
  }

  if (error) {
    return (
      <EmptyState
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            onClick={() => setReloadToken((token) => token + 1)}
            type="button"
          >
            Retry
          </button>
        }
        description={error}
        title="Projects could not be loaded"
      />
    );
  }

  if (projects.length === 0) {
    const emptyDescription = getProjectEmptyDescription(
      canCreateProjects,
      currentUser,
    );

    return (
      <EmptyState
        action={
          canCreateProjects ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              href="/dashboard/projects/new"
            >
              Create project
            </Link>
          ) : null
        }
        description={emptyDescription}
        title="No projects yet"
      />
    );
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white shadow-sm">
      <div className="space-y-4 border-b border-ink/10 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-mint">
              Available projects
            </h2>
          </div>
          <span className="text-sm font-medium text-ink/55 sm:text-right">
            {isFilterActive ? `${matchingProjects.length} of ` : ""}
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <div>
          <TextInput
            autoComplete="off"
            className="w-full"
            label="Project filter"
            list="project-name-suggestions"
            name="project-name-filter"
            onChange={(event) => handleFilterChange(event.target.value)}
            placeholder="Type first 3 letters"
            type="search"
            value={projectFilter}
          />
          <datalist id="project-name-suggestions">
            {suggestedProjects.map((project) => (
              <option key={project.id} value={project.name} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="p-5">
        {paginatedProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-ink/15 bg-surface px-5 py-10 text-center">
            <h3 className="text-base font-semibold text-ink">
              No projects match this name.
            </h3>
            <p className="mt-2 text-sm text-ink/55">
              Try another project name or clear the filter.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-ink/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 text-sm font-medium text-ink sm:flex-row sm:items-center">
          <p>
            Showing {firstVisibleProject} to {lastVisibleProject} of{" "}
            {matchingProjects.length} results
          </p>
          <label
            className="flex items-center gap-3 text-ink/70"
            htmlFor="projects-page-size"
          >
            Projects per page
            <select
              className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-semibold text-ink shadow-sm focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20"
              id="projects-page-size"
              onChange={(event) => handlePageSizeChange(event.target.value)}
              value={pageSize}
            >
              {PROJECTS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          aria-label="Projects pagination"
          className="flex items-center self-start overflow-hidden rounded-md border border-ink/15 shadow-sm lg:self-auto"
        >
          <button
            className="min-h-10 border-r border-ink/15 bg-white px-4 text-sm font-semibold text-ink/65 transition hover:bg-surface disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-white"
            disabled={activePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            type="button"
          >
            Previous
          </button>
          {visiblePages.map((page) => {
            const isActivePage = page === activePage;

            return (
              <button
                aria-current={isActivePage ? "page" : undefined}
                className={[
                  "min-h-10 min-w-11 border-r border-ink/15 bg-white px-3 text-sm font-semibold transition hover:bg-surface",
                  isActivePage
                    ? "border-ink text-blue-600 ring-1 ring-inset ring-ink"
                    : "text-ink/65",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            );
          })}
          <button
            className="min-h-10 bg-white px-4 text-sm font-semibold text-ink/65 transition hover:bg-surface disabled:cursor-not-allowed disabled:text-ink/25 disabled:hover:bg-white"
            disabled={activePage >= pageCount}
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function getProjectEmptyDescription(
  canCreateProjects: boolean,
  currentUser: SafeUser,
) {
  if (canCreateProjects) {
    return "Create the first project to start organizing issues, assignments, and team work.";
  }

  if (currentUser.role !== UserRole.User) {
    return "No projects are available to your account yet.";
  }

  return isNewlyRegisteredUser(currentUser)
    ? "Your account has been created successfully. An Admin or Manager must assign you to a project before you can access project tasks."
    : "You are not assigned to any project yet. Please contact your Admin or Manager.";
}

function isNewlyRegisteredUser(currentUser: SafeUser) {
  const createdAt = new Date(currentUser.createdAt).getTime();

  if (Number.isNaN(createdAt)) {
    return false;
  }

  return Date.now() - createdAt < 24 * 60 * 60 * 1000;
}
