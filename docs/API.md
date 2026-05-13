# API

TaskFlow exposes a JSON REST API through Next.js Route Handlers in `apps/web/app/api`. The same API is used by the web dashboard and the Expo mobile client.

## Base URLs

```text
Local:      http://localhost:3000/api
Production: https://your-taskflow-demo.netlify.app/api
```

## Response Format

Success responses use a `data` envelope:

```json
{
  "data": {
    "ok": true
  }
}
```

Error responses use an `error` envelope:

```json
{
  "error": {
    "message": "Invalid request body.",
    "details": {}
  }
}
```

Validation errors may include `error.details` from Zod.

## Authentication Requirements

TaskFlow uses JWT authentication.

Web clients authenticate through the `taskflow_token` httpOnly cookie set by login and registration responses. In production the cookie is secure, same-site lax, scoped to `/`, and expires after seven days.

Mobile clients store the returned token in Expo SecureStore and send it on protected requests:

```text
Authorization: Bearer <token>
```

Protected route helpers read the bearer token first and then fall back to the web cookie. API responses never return `passwordHash`.

## Authorization Rules

- `admin` users can access admin endpoints and manage all projects.
- `user` accounts can access only projects they own or where they have a `project_members` row.
- Project owners can update and delete their projects.
- Project owners and admins can assign, update, and remove project members.
- Project managers and project members can list members only for projects where they are assigned.
- Admins can access all tasks.
- Project owners and project members can list, view, create, update, and delete tasks in the project.
- Comments can be listed and created by admins and project participants.
- A comment can be deleted by its author or an admin.
- Attachments can be listed and uploaded by admins and project participants.
- The server derives the acting user from the JWT. Clients must not be trusted for `userId`, `role`, ownership, membership, or assignment decisions.

## Endpoint Summary

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Deployment health check. |
| `POST` | `/api/auth/register` | Public | Create account, return user and token, set web cookie. |
| `POST` | `/api/auth/login` | Public | Authenticate credentials, return user and token, set web cookie. |
| `POST` | `/api/auth/logout` | Public | Clear web auth cookie. |
| `GET` | `/api/auth/me` | Required | Return current user. |
| `GET` | `/api/users?search=` | Admin | Search users by name or email. |
| `GET` | `/api/projects` | Required | List visible projects. |
| `POST` | `/api/projects` | Required | Create a project owned by current user. |
| `GET` | `/api/projects/:id` | Required | Get one visible project. |
| `PATCH` | `/api/projects/:id` | Required | Update an owned project, or any project for admins. |
| `DELETE` | `/api/projects/:id` | Required | Delete an owned project, or any project for admins. |
| `GET` | `/api/projects/:id/members` | Required | List project members for an accessible project. |
| `POST` | `/api/projects/:id/members` | Required | Assign a user to an owned project, or any project for admins. |
| `PATCH` | `/api/projects/:id/members/:userId` | Required | Update a member role for an owned project, or any project for admins. |
| `DELETE` | `/api/projects/:id/members/:userId` | Required | Remove a member from an owned project, or any project for admins. |
| `GET` | `/api/projects/:id/tasks` | Required | List tasks in an accessible project. |
| `POST` | `/api/projects/:id/tasks` | Required | Create a task in an accessible project. |
| `GET` | `/api/tasks` | Required | List accessible tasks, optionally filtered by query params. |
| `POST` | `/api/tasks` | Required | Create a task using `projectId` from the request body. |
| `GET` | `/api/tasks/:taskId` | Required | Get one visible task. |
| `PATCH` | `/api/tasks/:taskId` | Required | Update a task in an accessible project. |
| `DELETE` | `/api/tasks/:taskId` | Required | Delete a task in an accessible project. |
| `GET` | `/api/tasks/:taskId/comments` | Required | List task comments. |
| `POST` | `/api/tasks/:taskId/comments` | Required | Create a task comment. |
| `DELETE` | `/api/comments/:commentId` | Required | Delete own comment or any comment as admin. |
| `GET` | `/api/tasks/:taskId/attachments` | Required | List task attachments. |
| `POST` | `/api/tasks/:taskId/attachments` | Required | Upload task attachment. |
| `GET` | `/api/admin/stats` | Admin | Return system totals and task breakdowns. |
| `GET` | `/api/admin/users` | Admin | List safe user objects. |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Update a user's role. |
| `GET` | `/api/admin/projects` | Admin | List all projects. |
| `DELETE` | `/api/admin/projects/:id` | Admin | Delete any project. |

## Auth Endpoints

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Response `201 Created`:

```json
{
  "data": {
    "user": {
      "id": "00000000-0000-4000-8000-000000000001",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "user",
      "createdAt": "2026-05-09T09:00:00.000Z",
      "updatedAt": "2026-05-09T09:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

Common errors: `400` invalid JSON or schema validation failure, `409` email already exists.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "admin@taskflow.dev",
  "password": "admin123"
}
```

Response `200 OK`:

```json
{
  "data": {
    "user": {
      "id": "00000000-0000-4000-8000-000000000001",
      "email": "admin@taskflow.dev",
      "name": "TaskFlow Admin",
      "role": "admin",
      "createdAt": "2026-05-08T09:00:00.000Z",
      "updatedAt": "2026-05-08T09:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

Common errors: `400` invalid request, `401` invalid email or password.

### Logout

```http
POST /api/auth/logout
```

Response:

```json
{
  "data": {
    "ok": true
  }
}
```

### Current User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "user": {
      "id": "00000000-0000-4000-8000-000000000002",
      "email": "demo@taskflow.dev",
      "name": "Demo User",
      "role": "user",
      "createdAt": "2026-05-08T09:00:00.000Z",
      "updatedAt": "2026-05-08T09:00:00.000Z"
    }
  }
}
```

Common error: `401` missing, invalid, or expired token.

## User Endpoints

### Search Users

```http
GET /api/users?search=ada
Authorization: Bearer <admin-token>
```

Only admin users can list or search users. The optional `search` query matches name or email case-insensitively. Results are limited to 20 users and never include password hashes or sensitive fields.

Response:

```json
{
  "data": {
    "users": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "role": "user",
        "createdAt": "2026-05-09T09:00:00.000Z"
      }
    ]
  }
}
```

Common errors: `400` invalid query parameters, `401` unauthenticated, `403` admin access required.

## Project Endpoints

Project inputs are validated with shared Zod schemas. Project names are required, and descriptions are optional.

### List Projects

```http
GET /api/projects
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "projects": [
      {
        "id": "10000000-0000-4000-8000-000000000001",
        "name": "TaskFlow Web Platform",
        "description": "Demo project for the web dashboard, REST API, and admin workflows.",
        "ownerId": "00000000-0000-4000-8000-000000000001",
        "createdAt": "2026-05-08T09:00:00.000Z",
        "updatedAt": "2026-05-08T09:00:00.000Z"
      }
    ]
  }
}
```

### Create Project

```http
POST /api/projects
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "name": "Capstone Website",
  "description": "Final project tracking board."
}
```

Response `201 Created`:

```json
{
  "data": {
    "project": {
      "id": "project-uuid",
      "name": "Capstone Website",
      "description": "Final project tracking board.",
      "ownerId": "current-user-uuid",
      "createdAt": "2026-05-09T09:00:00.000Z",
      "updatedAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

The API also adds the creator to `project_members` with role `owner`.

### Get, Update, And Delete Project

```http
GET /api/projects/:id
PATCH /api/projects/:id
DELETE /api/projects/:id
Authorization: Bearer <token>
```

Update request:

```json
{
  "name": "Capstone Launch",
  "description": "Updated project brief."
}
```

Delete response:

```json
{
  "data": {
    "ok": true
  }
}
```

Common errors: `400` invalid project id or request body, `401` unauthenticated, `403` access denied, `404` project not found.

## Project Member Endpoints

Project member inputs are validated with shared Zod schemas. Assignable roles are `manager` and `member`; the `owner` role is created with the project and cannot be changed through these endpoints.

### List Project Members

```http
GET /api/projects/:id/members
Authorization: Bearer <token>
```

Admins, project owners, project managers, and assigned project members can list members for projects they can access.

Response:

```json
{
  "data": {
    "canManage": true,
    "project": {
      "id": "project-uuid",
      "name": "Capstone Website",
      "ownerId": "owner-user-uuid"
    },
    "assignableUsers": [
      {
        "id": "available-user-uuid",
        "email": "student@example.com",
        "name": "Student User",
        "role": "user",
        "createdAt": "2026-05-08T09:00:00.000Z",
        "updatedAt": "2026-05-08T09:00:00.000Z"
      }
    ],
    "members": [
      {
        "id": "member-uuid",
        "projectId": "project-uuid",
        "userId": "user-uuid",
        "role": "member",
        "createdAt": "2026-05-09T09:00:00.000Z",
        "updatedAt": "2026-05-09T09:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "email": "demo@taskflow.dev",
          "name": "Demo User",
          "role": "user",
          "createdAt": "2026-05-08T09:00:00.000Z",
          "updatedAt": "2026-05-08T09:00:00.000Z"
        }
      }
    ]
  }
}
```

`assignableUsers` contains safe user objects only when the requester can manage project members. Project managers and members receive an empty list and can view the member table only.

### Assign Project Member

```http
POST /api/projects/:id/members
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "userId": "user-uuid",
  "role": "member"
}
```

Response `201 Created`:

```json
{
  "data": {
    "member": {
      "id": "member-uuid",
      "projectId": "project-uuid",
      "userId": "user-uuid",
      "role": "member",
      "createdAt": "2026-05-09T09:00:00.000Z",
      "updatedAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

Admins can assign members to any project. Project owners can assign members only to their own projects. Duplicate assignments return `409 Conflict`.

### Update Or Remove Project Member

```http
PATCH /api/projects/:id/members/:userId
DELETE /api/projects/:id/members/:userId
Authorization: Bearer <token>
```

Patch request:

```json
{
  "role": "manager"
}
```

`PATCH` returns the updated member with `200 OK`. `DELETE` returns `{ "data": { "ok": true } }`.

Admins and project owners can update or remove non-owner project members. The project owner cannot be demoted or removed through these endpoints.

Common errors: `400` invalid id or body, `401` unauthenticated, `403` access denied, `404` project, user, or member not found, `409` duplicate assignment.

## Task Endpoints

Valid statuses: `todo`, `in_progress`, `done`.

Valid priorities: `low`, `medium`, `high`.

`dueDate` is optional and must be an ISO datetime string with an offset when provided.

### List Project Tasks

```http
GET /api/projects/:id/tasks
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "tasks": [
      {
        "id": "20000000-0000-4000-8000-000000000001",
        "projectId": "10000000-0000-4000-8000-000000000001",
        "title": "Define dashboard metrics",
        "description": "Choose the project health, task volume, and completion metrics shown on the dashboard.",
        "status": "todo",
        "priority": "high",
        "assigneeId": "00000000-0000-4000-8000-000000000001",
        "createdById": "00000000-0000-4000-8000-000000000001",
        "dueDate": "2026-05-15T09:00:00.000Z",
        "createdAt": "2026-05-08T09:00:00.000Z",
        "updatedAt": "2026-05-08T09:00:00.000Z"
      }
    ]
  }
}
```

### List Tasks

```http
GET /api/tasks?projectId=project-uuid&status=todo&priority=high
Authorization: Bearer <token>
```

Supported filters are `projectId`, `status`, `priority`, `assigneeId`, and `createdById`. Admins can list all matching tasks. Normal users receive only tasks whose project they own or where they have a `project_members` row.

Response uses the same `{ "data": { "tasks": [] } }` shape as project task lists.

### Create Task

```http
POST /api/projects/:id/tasks
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "title": "Draft presentation slides",
  "description": "Prepare the final capstone review deck.",
  "status": "todo",
  "priority": "high",
  "assigneeId": "00000000-0000-4000-8000-000000000002",
  "dueDate": "2026-05-20T09:00:00.000Z"
}
```

Response `201 Created`:

```json
{
  "data": {
    "task": {
      "id": "task-uuid",
      "projectId": "project-uuid",
      "title": "Draft presentation slides",
      "description": "Prepare the final capstone review deck.",
      "status": "todo",
      "priority": "high",
      "assigneeId": "00000000-0000-4000-8000-000000000002",
      "createdById": "current-user-uuid",
      "dueDate": "2026-05-20T09:00:00.000Z",
      "createdAt": "2026-05-09T09:00:00.000Z",
      "updatedAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

If `assigneeId` is provided, the assignee must be the project owner or a project member.

Tasks can also be created through `POST /api/tasks` by including a required `projectId` field in the JSON body. The current user must be an admin, the project owner, or a project member.

### Get, Update, And Delete Task

```http
GET /api/tasks/:taskId
PATCH /api/tasks/:taskId
DELETE /api/tasks/:taskId
Authorization: Bearer <token>
```

Update request:

```json
{
  "title": "Finalize presentation slides",
  "status": "in_progress",
  "priority": "high",
  "assigneeId": null,
  "dueDate": null
}
```

Delete response:

```json
{
  "data": {
    "ok": true
  }
}
```

Common errors: `400` invalid id or body, `401` unauthenticated, `403` access denied, `404` task not found.

## Comment Endpoints

Comment content is required after trimming and must be at most 2000 characters.

### List Comments

```http
GET /api/tasks/:taskId/comments
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "comments": [
      {
        "id": "30000000-0000-4000-8000-000000000001",
        "taskId": "20000000-0000-4000-8000-000000000001",
        "authorId": "00000000-0000-4000-8000-000000000001",
        "content": "Start with the metrics already visible to users so the dashboard stays explainable.",
        "createdAt": "2026-05-08T09:00:00.000Z"
      }
    ]
  }
}
```

### Create Comment

```http
POST /api/tasks/:taskId/comments
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "content": "This is ready for review."
}
```

Response `201 Created`:

```json
{
  "data": {
    "comment": {
      "id": "comment-uuid",
      "taskId": "task-uuid",
      "authorId": "current-user-uuid",
      "content": "This is ready for review.",
      "createdAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

### Delete Comment

```http
DELETE /api/comments/:commentId
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "ok": true
  }
}
```

Common errors: `400` invalid id or body, `401` unauthenticated, `403` access denied, `404` task or comment not found.

## Attachment Endpoints

Attachments require object storage environment variables to be configured. The API accepts a `multipart/form-data` request with a `file` field.

Allowed files:

- Images: PNG, JPEG, GIF, WebP.
- Documents: PDF.
- Text formats: plain text, Markdown, CSV, JSON, XML, YAML, and log files.
- Maximum size: 10 MB.

### List Attachments

```http
GET /api/tasks/:taskId/attachments
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "attachments": [
      {
        "id": "attachment-uuid",
        "taskId": "task-uuid",
        "uploadedById": "user-uuid",
        "fileName": "brief.pdf",
        "fileUrl": "https://files.example.com/tasks/task-uuid/object-key.pdf",
        "fileType": "application/pdf",
        "fileSize": 24576,
        "createdAt": "2026-05-09T09:00:00.000Z"
      }
    ]
  }
}
```

### Upload Attachment

```http
POST /api/tasks/:taskId/attachments
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Form data:

```text
file=<image-pdf-or-text-file>
```

Response `201 Created`:

```json
{
  "data": {
    "attachment": {
      "id": "attachment-uuid",
      "taskId": "task-uuid",
      "uploadedById": "user-uuid",
      "fileName": "brief.pdf",
      "fileUrl": "https://files.example.com/tasks/task-uuid/object-key.pdf",
      "fileType": "application/pdf",
      "fileSize": 24576,
      "createdAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

Common errors: `400` invalid task id, invalid multipart form data, missing file, unsupported file type, empty file, or file over 10 MB; `500` storage not configured or upload failure.

## Admin Endpoints

All admin endpoints require an authenticated user with role `admin`.

### Admin Stats

```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

Response:

```json
{
  "data": {
    "totalUsers": 2,
    "totalProjects": 2,
    "totalTasks": 8,
    "totalComments": 6,
    "tasksByStatus": {
      "todo": 3,
      "in_progress": 2,
      "done": 3
    },
    "tasksByPriority": {
      "low": 2,
      "medium": 3,
      "high": 3
    }
  }
}
```

### Admin Users

```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

Response:

```json
{
  "data": {
    "users": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "email": "admin@taskflow.dev",
        "name": "TaskFlow Admin",
        "role": "admin",
        "createdAt": "2026-05-08T09:00:00.000Z",
        "updatedAt": "2026-05-08T09:00:00.000Z"
      }
    ]
  }
}
```

### Update User Role

```http
PATCH /api/admin/users/:id/role
Content-Type: application/json
Authorization: Bearer <admin-token>
```

Request:

```json
{
  "role": "admin"
}
```

Response:

```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "demo@taskflow.dev",
      "name": "Demo User",
      "role": "admin",
      "createdAt": "2026-05-08T09:00:00.000Z",
      "updatedAt": "2026-05-09T09:00:00.000Z"
    }
  }
}
```

### Admin Projects

```http
GET /api/admin/projects
DELETE /api/admin/projects/:id
Authorization: Bearer <admin-token>
```

`GET /api/admin/projects` returns all projects without membership filtering. `DELETE /api/admin/projects/:id` deletes any project and returns:

```json
{
  "data": {
    "ok": true
  }
}
```

Common admin errors: `401` unauthenticated, `403` admin access required, `400` invalid id or body, `404` record not found.

## Health Endpoint

```http
GET /api/health
```

Response:

```json
{
  "data": {
    "ok": true,
    "service": "taskflow-web",
    "version": "0.1.0"
  }
}
```
