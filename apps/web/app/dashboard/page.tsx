import type { Metadata } from "next";
import Link from "next/link";
import {
  type SafeUser,
  type Task,
  TaskStatus,
  UserRole,
} from "@taskflow/shared";
import { and, desc, eq, inArray, or } from "drizzle-orm";

import { db, schema } from "@/db";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { statusLabels } from "@/components/tasks/StatusBadge";
import { formatTaskDate } from "@/components/tasks/task-formatting";
import { requireDashboardUser } from "@/lib/dashboard-auth";
import { serializeTask } from "@/lib/tasks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Dashboard | TaskFlow",
};

const { projectMembers, projects, tasks } = schema;

const taskColumns = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done];

export default async function DashboardPage() {
  const user = await requireDashboardUser();
  const dashboard = await loadDashboardData(user);

  return <DashboardContent dashboard={dashboard} user={user} />;
}

type DashboardTask = Task & {
  projectName: string;
};

type DashboardData = {
  activeProjects: number;
  openIssues: number;
  teamMembers: number;
  tasks: DashboardTask[];
  nextTasks: DashboardTask[];
};

function DashboardContent({
  dashboard,
  user,
}: {
  dashboard: DashboardData;
  user: SafeUser;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const summaryCards = [
    {
      label: "Active projects",
      value: dashboard.activeProjects.toString(),
      tone: "text-mint",
    },
    {
      label: "Open issues",
      value: dashboard.openIssues.toString(),
      tone: "text-amber",
    },
    {
      label: "Team members",
      value: dashboard.teamMembers.toString(),
      tone: "text-berry",
    },
  ];
  const groupedTasks = taskColumns.map((status) => ({
    status,
    tasks: dashboard.tasks.filter((task) => task.status === status),
  }));

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
              {dashboard.tasks.length} issues
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {groupedTasks.map((column) => (
              <article
                className="min-h-52 rounded-md border border-ink/10 bg-surface p-3"
                key={column.status}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">
                    {statusLabels[column.status]}
                  </h3>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink/55">
                    {column.tasks.length}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => (
                      <IssueCard key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="rounded border border-dashed border-ink/15 bg-white px-3 py-4 text-sm text-ink/50">
                      No issues in this lane
                    </div>
                  )}
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
            <div className="mt-4 space-y-3">
              {dashboard.nextTasks.length > 0 ? (
                dashboard.nextTasks.map((task) => (
                  <Link
                    className="block rounded border border-ink/10 bg-surface px-3 py-3 text-sm transition hover:border-mint/40 hover:bg-mint/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                    href={`/dashboard/projects/${task.projectId}`}
                    key={task.id}
                  >
                    <span className="block font-semibold text-ink">{task.title}</span>
                    <span className="mt-1 block text-xs text-ink/55">
                      {task.dueDate
                        ? `Due ${formatTaskDate(task.dueDate)}`
                        : "No due date"}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="rounded border border-dashed border-ink/15 bg-surface px-3 py-4 text-sm text-ink/55">
                  No open issues need attention.
                </div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function IssueCard({ task }: { task: DashboardTask }) {
  return (
    <Link
      className="block rounded-md border border-ink/10 bg-white p-3 shadow-sm transition hover:border-mint/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
      href={`/dashboard/projects/${task.projectId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 break-words text-sm font-semibold leading-5 text-ink">
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="mt-2 truncate text-xs font-medium text-ink/50">
        {task.projectName}
      </p>
      <p className="mt-3 text-xs text-ink/55">
        {task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : "No due date"}
      </p>
    </Link>
  );
}

async function loadDashboardData(user: SafeUser): Promise<DashboardData> {
  const projectRecords =
    user.role === UserRole.Admin
      ? await db
          .select({
            createdAt: projects.createdAt,
            id: projects.id,
            ownerId: projects.ownerId,
            updatedAt: projects.updatedAt,
          })
          .from(projects)
          .orderBy(desc(projects.updatedAt), desc(projects.createdAt))
      : await db
          .selectDistinct({
            createdAt: projects.createdAt,
            id: projects.id,
            ownerId: projects.ownerId,
            updatedAt: projects.updatedAt,
          })
          .from(projects)
          .leftJoin(
            projectMembers,
            and(
              eq(projectMembers.projectId, projects.id),
              eq(projectMembers.userId, user.id),
            ),
          )
          .where(
            or(eq(projects.ownerId, user.id), eq(projectMembers.userId, user.id)),
          )
          .orderBy(desc(projects.updatedAt), desc(projects.createdAt));

  const projectIds = projectRecords.map((project) => project.id);

  if (projectIds.length === 0) {
    return {
      activeProjects: 0,
      nextTasks: [],
      openIssues: 0,
      tasks: [],
      teamMembers: 1,
    };
  }

  const [taskRecords, memberRecords] = await Promise.all([
    db
      .select({
        assigneeId: tasks.assigneeId,
        createdAt: tasks.createdAt,
        createdById: tasks.createdById,
        description: tasks.description,
        dueDate: tasks.dueDate,
        id: tasks.id,
        priority: tasks.priority,
        projectId: tasks.projectId,
        projectName: projects.name,
        status: tasks.status,
        title: tasks.title,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(inArray(tasks.projectId, projectIds))
      .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt)),
    db
      .selectDistinct({
        userId: projectMembers.userId,
      })
      .from(projectMembers)
      .where(inArray(projectMembers.projectId, projectIds)),
  ]);

  const dashboardTasks = taskRecords.map(({ projectName, ...task }) => ({
    ...serializeTask(task),
    projectName,
  }));
  const memberIds = new Set(
    [
      user.id,
      ...projectRecords.map((project) => project.ownerId),
      ...memberRecords.map((member) => member.userId),
    ].filter((id): id is string => Boolean(id)),
  );
  const openTasks = dashboardTasks.filter((task) => task.status !== TaskStatus.Done);
  const nextTasks = [...openTasks]
    .sort((first, second) => {
      const firstTime = first.dueDate
        ? new Date(first.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const secondTime = second.dueDate
        ? new Date(second.dueDate).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (firstTime !== secondTime) {
        return firstTime - secondTime;
      }

      return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
    })
    .slice(0, 3);

  return {
    activeProjects: projectRecords.length,
    nextTasks,
    openIssues: openTasks.length,
    tasks: dashboardTasks,
    teamMembers: memberIds.size,
  };
}
