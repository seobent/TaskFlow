import { neon } from "@neondatabase/serverless";
import {
  ProjectMemberRole,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@taskflow/shared";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema";

const { comments, projectMembers, projects, tasks, users } = schema;

const SALT_ROUNDS = 12;
const seedTimestamp = new Date("2026-05-08T09:00:00.000Z");

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

config({ path: resolve(webRoot, ".env.local") });
config({ path: resolve(webRoot, ".env") });

const seedIds = {
  users: {
    admin: "00000000-0000-4000-8000-000000000001",
    demo: "00000000-0000-4000-8000-000000000002",
  },
  projects: {
    platform: "10000000-0000-4000-8000-000000000001",
    mobile: "10000000-0000-4000-8000-000000000002",
  },
  memberships: {
    platformAdmin: "40000000-0000-4000-8000-000000000001",
    platformDemo: "40000000-0000-4000-8000-000000000002",
    mobileAdmin: "40000000-0000-4000-8000-000000000003",
    mobileDemo: "40000000-0000-4000-8000-000000000004",
  },
  tasks: {
    dashboardMetrics: "20000000-0000-4000-8000-000000000001",
    taskBoardFilters: "20000000-0000-4000-8000-000000000002",
    mobileAuthChecklist: "20000000-0000-4000-8000-000000000003",
    emptyStates: "20000000-0000-4000-8000-000000000004",
    apiNotes: "20000000-0000-4000-8000-000000000005",
    memberScreen: "20000000-0000-4000-8000-000000000006",
    netlifySettings: "20000000-0000-4000-8000-000000000007",
    demoScript: "20000000-0000-4000-8000-000000000008",
  },
  comments: {
    dashboardMetrics: "30000000-0000-4000-8000-000000000001",
    taskBoardFilters: "30000000-0000-4000-8000-000000000002",
    mobileAuthChecklist: "30000000-0000-4000-8000-000000000003",
    apiNotes: "30000000-0000-4000-8000-000000000004",
    memberScreen: "30000000-0000-4000-8000-000000000005",
    demoScript: "30000000-0000-4000-8000-000000000006",
  },
} as const;

type SeedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

function createSeedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  return drizzle(neon(databaseUrl), { schema });
}

type SeedDatabase = ReturnType<typeof createSeedDatabase>;

const seedUsers: SeedUser[] = [
  {
    id: seedIds.users.admin,
    name: "TaskFlow Admin",
    email: "admin@taskflow.dev",
    password: "admin123",
    role: UserRole.Admin,
  },
  {
    id: seedIds.users.demo,
    name: "Demo User",
    email: "demo@taskflow.dev",
    password: "demo123",
    role: UserRole.User,
  },
];

async function upsertUser(db: SeedDatabase, user: SeedUser) {
  const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
  const [record] = await db
    .insert(users)
    .values({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: user.name,
        passwordHash,
        role: user.role,
        updatedAt: seedTimestamp,
      },
    })
    .returning({ id: users.id });

  if (!record) {
    throw new Error(`Unable to seed user ${user.email}.`);
  }

  return record.id;
}

async function upsertProject(
  db: SeedDatabase,
  id: string,
  name: string,
  description: string,
  ownerId: string,
) {
  await db
    .insert(projects)
    .values({
      id,
      name,
      description,
      ownerId,
      createdAt: seedTimestamp,
      updatedAt: seedTimestamp,
    })
    .onConflictDoUpdate({
      target: projects.id,
      set: {
        name,
        description,
        ownerId,
        updatedAt: seedTimestamp,
      },
    });
}

async function upsertProjectMember(
  db: SeedDatabase,
  id: string,
  projectId: string,
  userId: string,
  role: ProjectMemberRole,
) {
  await db
    .insert(projectMembers)
    .values({
      id,
      projectId,
      userId,
      role,
      createdAt: seedTimestamp,
    })
    .onConflictDoUpdate({
      target: projectMembers.id,
      set: {
        projectId,
        userId,
        role,
      },
    });
}

async function main() {
  const db = createSeedDatabase();
  const [adminId, demoUserId] = await Promise.all(
    seedUsers.map((user) => upsertUser(db, user)),
  );

  await upsertProject(
    db,
    seedIds.projects.platform,
    "TaskFlow Web Platform",
    "Demo project for the web dashboard, REST API, and admin workflows.",
    adminId,
  );
  await upsertProject(
    db,
    seedIds.projects.mobile,
    "TaskFlow Mobile Client",
    "Demo project for the Expo mobile client and cross-platform API use.",
    demoUserId,
  );

  await Promise.all([
    upsertProjectMember(
      db,
      seedIds.memberships.platformAdmin,
      seedIds.projects.platform,
      adminId,
      ProjectMemberRole.Manager,
    ),
    upsertProjectMember(
      db,
      seedIds.memberships.platformDemo,
      seedIds.projects.platform,
      demoUserId,
      ProjectMemberRole.Member,
    ),
    upsertProjectMember(
      db,
      seedIds.memberships.mobileAdmin,
      seedIds.projects.mobile,
      adminId,
      ProjectMemberRole.Member,
    ),
    upsertProjectMember(
      db,
      seedIds.memberships.mobileDemo,
      seedIds.projects.mobile,
      demoUserId,
      ProjectMemberRole.Manager,
    ),
  ]);

  const seedTasks = [
    {
      id: seedIds.tasks.dashboardMetrics,
      projectId: seedIds.projects.platform,
      title: "Define dashboard metrics",
      description:
        "Choose the project health, task volume, and completion metrics shown on the dashboard.",
      status: TaskStatus.Todo,
      priority: TaskPriority.High,
      assigneeId: adminId,
      createdById: adminId,
      dueDate: new Date("2026-05-15T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.taskBoardFilters,
      projectId: seedIds.projects.platform,
      title: "Build task board filters",
      description:
        "Add status and priority filters that work cleanly for web and mobile API consumers.",
      status: TaskStatus.InProgress,
      priority: TaskPriority.High,
      assigneeId: demoUserId,
      createdById: adminId,
      dueDate: new Date("2026-05-18T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.mobileAuthChecklist,
      projectId: seedIds.projects.mobile,
      title: "Write mobile auth QA checklist",
      description:
        "Capture login, logout, token expiration, and unauthorized response checks for Expo.",
      status: TaskStatus.Done,
      priority: TaskPriority.Medium,
      assigneeId: demoUserId,
      createdById: demoUserId,
      dueDate: new Date("2026-05-10T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.emptyStates,
      projectId: seedIds.projects.platform,
      title: "Polish project empty states",
      description:
        "Review empty project, task, and comment states for clear web dashboard copy.",
      status: TaskStatus.Todo,
      priority: TaskPriority.Low,
      assigneeId: adminId,
      createdById: demoUserId,
      dueDate: new Date("2026-05-22T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.apiNotes,
      projectId: seedIds.projects.platform,
      title: "Draft API integration notes",
      description:
        "Document shared REST response shapes and authentication behavior for client teams.",
      status: TaskStatus.Done,
      priority: TaskPriority.High,
      assigneeId: adminId,
      createdById: adminId,
      dueDate: new Date("2026-05-09T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.memberScreen,
      projectId: seedIds.projects.mobile,
      title: "Add project member screen",
      description:
        "Create the mobile member list screen using the existing API authorization rules.",
      status: TaskStatus.InProgress,
      priority: TaskPriority.Medium,
      assigneeId: demoUserId,
      createdById: adminId,
      dueDate: new Date("2026-05-20T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.netlifySettings,
      projectId: seedIds.projects.platform,
      title: "Verify Netlify environment settings",
      description:
        "Confirm DATABASE_URL and JWT_SECRET are configured only as server-side variables.",
      status: TaskStatus.Todo,
      priority: TaskPriority.Medium,
      assigneeId: adminId,
      createdById: adminId,
      dueDate: new Date("2026-05-24T09:00:00.000Z"),
    },
    {
      id: seedIds.tasks.demoScript,
      projectId: seedIds.projects.mobile,
      title: "Prepare release demo script",
      description:
        "Write a short walkthrough covering project lists, task updates, and comments.",
      status: TaskStatus.Done,
      priority: TaskPriority.Low,
      assigneeId: demoUserId,
      createdById: demoUserId,
      dueDate: new Date("2026-05-12T09:00:00.000Z"),
    },
  ];

  for (const task of seedTasks) {
    await db
      .insert(tasks)
      .values({
        ...task,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
      })
      .onConflictDoUpdate({
        target: tasks.id,
        set: {
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          createdById: task.createdById,
          dueDate: task.dueDate,
          updatedAt: seedTimestamp,
        },
      });
  }

  const seedComments = [
    {
      id: seedIds.comments.dashboardMetrics,
      taskId: seedIds.tasks.dashboardMetrics,
      authorId: adminId,
      content:
        "Start with the metrics already visible to users so the dashboard stays explainable.",
    },
    {
      id: seedIds.comments.taskBoardFilters,
      taskId: seedIds.tasks.taskBoardFilters,
      authorId: demoUserId,
      content:
        "I have the status filter working locally and am checking priority combinations next.",
    },
    {
      id: seedIds.comments.mobileAuthChecklist,
      taskId: seedIds.tasks.mobileAuthChecklist,
      authorId: adminId,
      content:
        "Checklist looks good. Please keep the SecureStore token case in the final notes.",
    },
    {
      id: seedIds.comments.apiNotes,
      taskId: seedIds.tasks.apiNotes,
      authorId: demoUserId,
      content:
        "Added examples for cookie auth on web and bearer auth on mobile.",
    },
    {
      id: seedIds.comments.memberScreen,
      taskId: seedIds.tasks.memberScreen,
      authorId: demoUserId,
      content:
        "The first screen pass is ready; next step is handling forbidden projects gracefully.",
    },
    {
      id: seedIds.comments.demoScript,
      taskId: seedIds.tasks.demoScript,
      authorId: adminId,
      content:
        "Use the two seeded projects to show both admin and regular user perspectives.",
    },
  ];

  for (const comment of seedComments) {
    await db
      .insert(comments)
      .values({
        ...comment,
        createdAt: seedTimestamp,
      })
      .onConflictDoUpdate({
        target: comments.id,
        set: {
          taskId: comment.taskId,
          authorId: comment.authorId,
          content: comment.content,
        },
      });
  }

  console.log("TaskFlow seed complete.");
  console.log(`Users: ${seedUsers.length}`);
  console.log("Projects: 2");
  console.log("Project members: 4");
  console.log(`Tasks: ${seedTasks.length}`);
  console.log(`Comments: ${seedComments.length}`);
}

main().catch((error: unknown) => {
  console.error("TaskFlow seed failed.");

  if (error instanceof Error) {
    console.error(error.message);
    printDatabaseCause(error);
  }

  process.exitCode = 1;
});

function printDatabaseCause(error: Error) {
  if (!("cause" in error) || !error.cause) {
    return;
  }

  const cause = error.cause;

  if (cause instanceof Error) {
    console.error(cause.message);
    return;
  }

  if (typeof cause === "object") {
    const details = cause as {
      code?: unknown;
      detail?: unknown;
      message?: unknown;
    };
    const parts = [
      typeof details.code === "string" ? `code=${details.code}` : null,
      typeof details.message === "string" ? details.message : null,
      typeof details.detail === "string" ? details.detail : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      console.error(parts.join(" "));
    }
  }
}
