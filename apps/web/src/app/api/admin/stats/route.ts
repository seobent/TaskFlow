import {
  TaskPriority,
  taskPrioritySchema,
  TaskStatus,
  taskStatusSchema,
} from "@taskflow/shared";
import { count } from "drizzle-orm";

import { db, schema } from "@/db";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AuthError } from "@/lib/auth";
import { requireAdmin } from "@/lib/authorization";

const { comments, projects, tasks, users } = schema;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const [
      totalUserRows,
      totalProjectRows,
      totalTaskRows,
      totalCommentRows,
      statusRows,
      priorityRows,
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(projects),
      db.select({ value: count() }).from(tasks),
      db.select({ value: count() }).from(comments),
      db
        .select({
          status: tasks.status,
          count: count(),
        })
        .from(tasks)
        .groupBy(tasks.status),
      db
        .select({
          priority: tasks.priority,
          count: count(),
        })
        .from(tasks)
        .groupBy(tasks.priority),
    ]);

    return apiSuccess({
      totalUsers: getCountValue(totalUserRows),
      totalProjects: getCountValue(totalProjectRows),
      totalTasks: getCountValue(totalTaskRows),
      totalComments: getCountValue(totalCommentRows),
      tasksByStatus: buildStatusCounts(statusRows),
      tasksByPriority: buildPriorityCounts(priorityRows),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }

    return apiError("Unable to load admin stats.", 500);
  }
}

function getCountValue(rows: Array<{ value: number }>) {
  return Number(rows[0]?.value ?? 0);
}

function buildStatusCounts(rows: Array<{ status: string; count: number }>) {
  const counts: Record<TaskStatus, number> = {
    [TaskStatus.Todo]: 0,
    [TaskStatus.InProgress]: 0,
    [TaskStatus.Done]: 0,
  };

  for (const row of rows) {
    const parsed = taskStatusSchema.safeParse(row.status);

    if (parsed.success) {
      counts[parsed.data] = Number(row.count);
    }
  }

  return counts;
}

function buildPriorityCounts(rows: Array<{ priority: string; count: number }>) {
  const counts: Record<TaskPriority, number> = {
    [TaskPriority.Low]: 0,
    [TaskPriority.Medium]: 0,
    [TaskPriority.High]: 0,
  };

  for (const row of rows) {
    const parsed = taskPrioritySchema.safeParse(row.priority);

    if (parsed.success) {
      counts[parsed.data] = Number(row.count);
    }
  }

  return counts;
}
