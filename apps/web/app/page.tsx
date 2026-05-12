import { TASKFLOW_APP_NAME, TaskPriority, TaskStatus } from "@taskflow/shared";
import Link from "next/link";

import { TaskFlowLogo } from "@/components/TaskFlowLogo";

const workspaceStats = [
  {
    label: "Projects",
    value: "2",
    detail: "Active capstone workspaces",
    tone: "border-mint bg-mint/10 text-mint",
  },
  {
    label: "Issues",
    value: "8",
    detail: "Across planning, build, and QA",
    tone: "border-amber bg-amber/10 text-amber",
  },
  {
    label: "Teams",
    value: "2",
    detail: "Seeded demo accounts",
    tone: "border-berry bg-berry/10 text-berry",
  },
];

const projects = [
  {
    name: "TaskFlow Web Platform",
    description: "Dashboard, REST API, auth, and admin workflow delivery.",
    meta: "5 issues",
  },
  {
    name: "TaskFlow Mobile Client",
    description: "Expo client, secure token storage, and cross-platform API use.",
    meta: "3 issues",
  },
];

const teamMembers = [
  { name: "TaskFlow Admin", role: "Project owner", initials: "TA" },
  { name: "Demo User", role: "Mobile lead", initials: "DU" },
];

const taskColumns = [
  {
    status: TaskStatus.Todo,
    title: "To Do",
    tasks: [
      {
        title: "Define dashboard metrics",
        project: "Web Platform",
        priority: TaskPriority.High,
        due: "May 15",
      },
      {
        title: "Verify Netlify environment settings",
        project: "Web Platform",
        priority: TaskPriority.Medium,
        due: "May 24",
      },
    ],
  },
  {
    status: TaskStatus.InProgress,
    title: "In Progress",
    tasks: [
      {
        title: "Build task board filters",
        project: "Web Platform",
        priority: TaskPriority.High,
        due: "May 18",
      },
      {
        title: "Add project member screen",
        project: "Mobile Client",
        priority: TaskPriority.Medium,
        due: "May 20",
      },
    ],
  },
  {
    status: TaskStatus.Done,
    title: "Done",
    tasks: [
      {
        title: "Draft API integration notes",
        project: "Web Platform",
        priority: TaskPriority.High,
        due: "Complete",
      },
      {
        title: "Prepare release demo script",
        project: "Mobile Client",
        priority: TaskPriority.Low,
        due: "Complete",
      },
    ],
  },
];

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "Low",
  [TaskPriority.Medium]: "Medium",
  [TaskPriority.High]: "High",
};

const priorityClasses: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "border-mint/20 bg-mint/10 text-mint",
  [TaskPriority.Medium]: "border-amber/25 bg-amber/10 text-amber",
  [TaskPriority.High]: "border-berry/25 bg-berry/10 text-berry",
};

const statusClasses: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: "bg-ink/45",
  [TaskStatus.InProgress]: "bg-amber",
  [TaskStatus.Done]: "bg-mint",
};

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex min-h-14 flex-col gap-4 rounded-md border border-ink/10 bg-white/85 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link
            aria-label={`${TASKFLOW_APP_NAME} home`}
            className="inline-flex shrink-0 items-center"
            href="/"
          >
            <TaskFlowLogo className="h-11 w-auto" />
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-ink/65 transition hover:bg-ink/5 hover:text-ink"
              href="/login"
            >
              Log in
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              href="/register"
            >
              Create account
            </Link>
          </nav>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-md border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                  Capstone workspace
                </p>
                <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  Plan projects, issues, and team handoffs in one calm board.
                </h1>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/65">
                A practical preview of the TaskFlow workspace your seeded demo
                data opens after login.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {workspaceStats.map((item) => (
                <article
                  className="rounded-md border border-ink/10 bg-surface p-4"
                  key={item.label}
                >
                  <div
                    className={`inline-flex min-h-8 items-center rounded border px-2 text-xs font-semibold ${item.tone}`}
                  >
                    {item.label}
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-ink">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-ink/60">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-ink">Projects</h2>
                <span className="rounded bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">
                  Live demo
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {projects.map((project) => (
                  <article
                    className="rounded-md border border-ink/10 bg-surface p-3"
                    key={project.name}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold leading-5 text-ink">
                        {project.name}
                      </h3>
                      <span className="whitespace-nowrap text-xs font-semibold text-ink/45">
                        {project.meta}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-ink/60">
                      {project.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink">Team</h2>
              <div className="mt-4 grid gap-3">
                {teamMembers.map((member) => (
                  <div className="flex items-center gap-3" key={member.name}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {member.name}
                      </p>
                      <p className="truncate text-xs font-medium text-ink/55">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-md border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-mint">
                Issue board
              </p>
              <h2 className="mt-1 text-xl font-semibold text-ink">
                Current sprint preview
              </h2>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              href="/login"
            >
              Open workspace
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {taskColumns.map((column) => (
              <section
                className="flex min-h-72 flex-col rounded-md border border-ink/10 bg-surface p-3"
                key={column.status}
              >
                <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${statusClasses[column.status]}`}
                    />
                    <h3 className="text-sm font-semibold text-ink">
                      {column.title}
                    </h3>
                  </div>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-ink/55">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="mt-3 grid flex-1 gap-3">
                  {column.tasks.map((task) => (
                    <article
                      className="rounded-md border border-ink/10 bg-white p-4 shadow-sm"
                      key={task.title}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="break-words text-base font-semibold leading-6 text-ink">
                            {task.title}
                          </h4>
                          <p className="mt-1 text-xs font-medium text-ink/45">
                            {task.project}
                          </p>
                        </div>
                        <span
                          className={`inline-flex min-h-6 shrink-0 items-center rounded border px-2 text-xs font-semibold ${priorityClasses[task.priority]}`}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                          Due
                        </span>
                        <span className="text-sm font-semibold text-ink/70">
                          {task.due}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
