import { z } from "zod";

export const TASKFLOW_APP_NAME = "TaskFlow";

export type TaskFlowRuntime = "development" | "preview" | "production";

export interface ApiEnvelope<TData> {
  data: TData;
  meta?: Record<string, unknown>;
}

export type EntityId = string;
export type ISODateString = string;

export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  User = "user"
}

export enum ProjectMemberRole {
  Owner = "owner",
  Member = "member",
  Manager = "manager"
}

export enum TaskStatus {
  Todo = "todo",
  InProgress = "in_progress",
  Done = "done"
}

export enum TaskPriority {
  Low = "low",
  Medium = "medium",
  High = "high"
}

export const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_FILE_ACCEPT =
  ".png,.jpg,.jpeg,.gif,.webp,application/pdf,text/plain,text/markdown," +
  "text/csv,.txt,.md,.markdown,.csv,.json,.log,.xml,.yaml,.yml";

export interface User {
  id: EntityId;
  email: string;
  name: string;
  role: UserRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type SafeUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "createdAt" | "updatedAt"
>;

export interface Project {
  id: EntityId;
  name: string;
  description: string | null;
  ownerId: EntityId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ProjectMember {
  id: EntityId;
  projectId: EntityId;
  userId: EntityId;
  role: ProjectMemberRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Task {
  id: EntityId;
  projectId: EntityId;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: EntityId | null;
  createdById: EntityId;
  dueDate: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Comment {
  id: EntityId;
  taskId: EntityId;
  authorId: EntityId;
  content: string;
  createdAt: ISODateString;
}

export interface Attachment {
  id: EntityId;
  taskId: EntityId;
  uploadedById: EntityId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: ISODateString;
}

const hasAtLeastOneDefinedValue = (value: Record<string, unknown>) =>
  Object.values(value).some((item) => item !== undefined);

export const idSchema = z.string().trim().min(1).max(128);
export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().trim().min(1).max(120);
export const projectDescriptionSchema = z.string().trim().max(2000);
export const taskTitleSchema = z.string().trim().min(1).max(160);
export const taskDescriptionSchema = z.string().trim().max(5000);
export const commentContentSchema = z
  .string({
    required_error: "Comment content is required."
  })
  .trim()
  .min(1, "Comment content is required.")
  .max(2000, "Comment content must be at most 2000 characters.");
export const dueDateSchema = z.string().trim().datetime({ offset: true }).max(40);

export const userRoleSchema = z.nativeEnum(UserRole);
export const projectMemberRoleSchema = z.nativeEnum(ProjectMemberRole);
export const assignableProjectMemberRoleSchema = z.enum([
  ProjectMemberRole.Manager,
  ProjectMemberRole.Member
]);
export const taskStatusSchema = z.nativeEnum(TaskStatus);
export const taskPrioritySchema = z.nativeEnum(TaskPriority);
export const taskAssigneeIdSchema = idSchema.uuid("Invalid assignee id.");

export const registerInputSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
});

export const createProjectInputSchema = z.object({
  name: nameSchema,
  description: projectDescriptionSchema.optional()
});

export const updateProjectInputSchema = createProjectInputSchema
  .partial()
  .refine(hasAtLeastOneDefinedValue, {
    message: "At least one project field is required."
  });

export const assignProjectMemberSchema = z.object({
  userId: idSchema.uuid("Invalid user id."),
  role: assignableProjectMemberRoleSchema.default(ProjectMemberRole.Member)
});

export const updateProjectMemberSchema = z.object({
  role: assignableProjectMemberRoleSchema
});

export const createTaskInputSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema.nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: taskAssigneeIdSchema.nullable().optional(),
  dueDate: dueDateSchema.nullable().optional()
});

export const updateTaskInputSchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigneeId: taskAssigneeIdSchema.nullable().optional(),
    dueDate: dueDateSchema.nullable().optional()
  })
  .refine(hasAtLeastOneDefinedValue, {
    message: "At least one task field is required."
  });

export const createCommentInputSchema = z.object({
  content: commentContentSchema
});

export const updateUserRoleInputSchema = z.object({
  role: userRoleSchema
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
export type AssignProjectMemberInput = z.infer<typeof assignProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<typeof updateProjectMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;
