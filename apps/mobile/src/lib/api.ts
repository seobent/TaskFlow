import type {
  ApiEnvelope,
  Comment,
  CreateCommentInput,
  CreateTaskInput,
  EntityId,
  LoginInput,
  Project,
  RegisterInput,
  SafeUser,
  Task,
  UpdateTaskInput,
} from "@taskflow/shared";

import {
  deleteAuthToken,
  getAuthToken,
  saveAuthToken,
} from "./auth-storage";

const DEFAULT_API_URL = "http://localhost:3000";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

type AuthResponse = {
  user: SafeUser;
  token: string;
};

type ApiErrorPayload = {
  error?: {
    message?: unknown;
    details?: unknown;
  };
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
};

export class ApiClientError extends Error {
  status: number | null;
  details: unknown;

  constructor(message: string, status: number | null = null, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export async function register(input: RegisterInput) {
  const data = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
    authenticated: false,
  });

  await saveAuthTokenFromResponse(data);

  return data;
}

export async function login(input: LoginInput) {
  const data = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
    authenticated: false,
  });

  await saveAuthTokenFromResponse(data);

  return data;
}

export async function logout() {
  const token = await getAuthToken();

  try {
    if (token) {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", {
        method: "POST",
      });
    }
  } finally {
    await deleteAuthToken();
  }
}

export async function getCurrentUser() {
  const data = await apiRequest<{ user: SafeUser }>("/api/auth/me");

  return data.user;
}

export async function getProjects() {
  const data = await apiRequest<{ projects: Project[] }>("/api/projects");

  return data.projects;
}

export async function getProject(projectId: EntityId) {
  const data = await apiRequest<{ project: Project }>(
    `/api/projects/${encodePathSegment(projectId)}`,
  );

  return data.project;
}

export async function getProjectTasks(projectId: EntityId) {
  const data = await apiRequest<{ tasks: Task[] }>(
    `/api/projects/${encodePathSegment(projectId)}/tasks`,
  );

  return data.tasks;
}

export async function createTask(projectId: EntityId, input: CreateTaskInput) {
  const data = await apiRequest<{ task: Task }>(
    `/api/projects/${encodePathSegment(projectId)}/tasks`,
    {
      method: "POST",
      body: input,
    },
  );

  return data.task;
}

export async function updateTask(taskId: EntityId, input: UpdateTaskInput) {
  const data = await apiRequest<{ task: Task }>(
    `/api/tasks/${encodePathSegment(taskId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return data.task;
}

export async function getTaskComments(taskId: EntityId) {
  const data = await apiRequest<{ comments: Comment[] }>(
    `/api/tasks/${encodePathSegment(taskId)}/comments`,
  );

  return data.comments;
}

export async function createComment(
  taskId: EntityId,
  input: CreateCommentInput,
) {
  const data = await apiRequest<{ comment: Comment }>(
    `/api/tasks/${encodePathSegment(taskId)}/comments`,
    {
      method: "POST",
      body: input,
    },
  );

  return data.comment;
}

async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.authenticated !== false) {
    const token = await getAuthToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiClientError(
      `Unable to reach TaskFlow API at ${API_BASE_URL}. Make sure the web API is running (npm run dev:web), verify EXPO_PUBLIC_API_URL, and confirm you can open ${buildApiUrl("/api/health")} from your phone.`,
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    throw createResponseError(response, payload);
  }

  if (!isApiEnvelope<TData>(payload)) {
    throw new ApiClientError(
      "TaskFlow API returned an unexpected response.",
      response.status,
      payload,
    );
  }

  return payload.data;
}

async function saveAuthTokenFromResponse(data: AuthResponse) {
  if (!data.token) {
    throw new ApiClientError("TaskFlow API did not return an auth token.");
  }

  await saveAuthToken(data.token);
}

function buildApiUrl(path: string) {
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (baseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${baseUrl}${normalizedPath.slice("/api".length)}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function createResponseError(response: Response, payload: unknown) {
  const fallback = `TaskFlow API request failed with status ${response.status}.`;
  const apiError = readApiError(payload);

  return new ApiClientError(
    apiError.message ?? fallback,
    response.status,
    apiError.details,
  );
}

function readApiError(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) {
    return {};
  }

  const error = (payload as ApiErrorPayload).error;

  return {
    message:
      typeof error?.message === "string" && error.message.length > 0
        ? error.message
        : undefined,
    details: error?.details,
  };
}

function isApiEnvelope<TData>(payload: unknown): payload is ApiEnvelope<TData> {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

function encodePathSegment(value: EntityId) {
  return encodeURIComponent(value);
}
