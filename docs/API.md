# API

The TaskFlow API will be implemented with Next.js Route Handlers under `apps/web/app/api`.

## Local Base URL

```text
http://localhost:3000/api
```

## Netlify Base URL

```text
https://your-netlify-site.netlify.app/api
```

## Response Shape

Successful responses use a `data` envelope.

```json
{
  "data": {}
}
```

Error responses use an `error` envelope.

```json
{
  "error": {
    "message": "Invalid request body."
  }
}
```

Validation errors may include `error.details` from the shared Zod schema.

## Current Routes

- `GET /api/health`: scaffold health route for deployment and local smoke checks.
- `POST /api/auth/register`: creates a user account, returns a safe user object and JWT, and sets the web auth cookie.
- `POST /api/auth/login`: validates credentials, returns a safe user object and JWT, and sets the web auth cookie.
- `POST /api/auth/logout`: clears the web auth cookie.
- `GET /api/auth/me`: returns the current authenticated safe user.
- `GET /api/projects`: lists projects visible to the current user.
- `POST /api/projects`: creates a project owned by the current user.
- `GET /api/projects/[id]`: returns one visible project.
- `PATCH /api/projects/[id]`: updates a project owned by the current user, or any project for admins.
- `DELETE /api/projects/[id]`: deletes a project owned by the current user, or any project for admins.
- `GET /api/projects/[projectId]/tasks`: lists tasks in a project where the current user is owner or member.
- `POST /api/projects/[projectId]/tasks`: creates a task in a project where the current user is owner or member.
- `GET /api/tasks/[taskId]`: returns one task visible to the current user.
- `PATCH /api/tasks/[taskId]`: updates a task in a project where the current user is owner or member.
- `DELETE /api/tasks/[taskId]`: deletes a task when the current user is admin, project owner, task creator, or task assignee.

## Authentication

TaskFlow uses JWT authentication.

Web clients receive the JWT in an httpOnly cookie named `taskflow_token`.
The cookie uses `sameSite: "lax"` and is marked `secure` in production.

Mobile clients use the `token` returned by register and login responses and send it as:

```text
Authorization: Bearer <token>
```

API auth helpers read the bearer token first and then fall back to the httpOnly cookie.
API responses never include `passwordHash`.

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Success status: `201 Created`

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "user",
      "createdAt": "2026-05-05T00:00:00.000Z",
      "updatedAt": "2026-05-05T00:00:00.000Z"
    },
    "token": "jwt"
  }
}
```

Common errors:

- `400 Bad Request`: invalid JSON or schema validation failure.
- `409 Conflict`: email already exists.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "ada@example.com",
  "password": "secure-password"
}
```

Success status: `200 OK`

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "user",
      "createdAt": "2026-05-05T00:00:00.000Z",
      "updatedAt": "2026-05-05T00:00:00.000Z"
    },
    "token": "jwt"
  }
}
```

Common errors:

- `400 Bad Request`: invalid JSON or schema validation failure.
- `401 Unauthorized`: invalid email or password.

### Logout

```http
POST /api/auth/logout
```

Success status: `200 OK`

```json
{
  "data": {
    "ok": true
  }
}
```

### Me

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Success status: `200 OK`

```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "ada@example.com",
      "name": "Ada Lovelace",
      "role": "user",
      "createdAt": "2026-05-05T00:00:00.000Z",
      "updatedAt": "2026-05-05T00:00:00.000Z"
    }
  }
}
```

Common errors:

- `401 Unauthorized`: missing, invalid, or expired token.

## Projects

Project routes require authentication with either the web cookie or mobile bearer token.
Admins can view, update, and delete every project. Normal users can list and view projects they own or belong to, and can update or delete only projects they own.

### List Projects

```http
GET /api/projects
Authorization: Bearer <token>
```

Success status: `200 OK`

```json
{
  "data": {
    "projects": [
      {
        "id": "project-uuid",
        "name": "Website redesign",
        "description": "Launch work for the new public site.",
        "ownerId": "user-uuid",
        "createdAt": "2026-05-05T00:00:00.000Z",
        "updatedAt": "2026-05-05T00:00:00.000Z"
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

Request body:

```json
{
  "name": "Website redesign",
  "description": "Launch work for the new public site."
}
```

Success status: `201 Created`

Creates the project with the current user as owner and adds the same user to `project_members` with role `manager`.

Common errors:

- `400 Bad Request`: invalid JSON or schema validation failure.
- `401 Unauthorized`: missing, invalid, or expired token.

### Get Project

```http
GET /api/projects/project-uuid
Authorization: Bearer <token>
```

Success status: `200 OK`

Common errors:

- `400 Bad Request`: invalid project id.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot view the project.
- `404 Not Found`: project does not exist.

### Update Project

```http
PATCH /api/projects/project-uuid
Content-Type: application/json
Authorization: Bearer <token>
```

Request body:

```json
{
  "name": "Website launch",
  "description": "Updated project brief."
}
```

Success status: `200 OK`

Common errors:

- `400 Bad Request`: invalid project id, invalid JSON, or schema validation failure.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot manage the project.
- `404 Not Found`: project does not exist.

### Delete Project

```http
DELETE /api/projects/project-uuid
Authorization: Bearer <token>
```

Success status: `200 OK`

```json
{
  "data": {
    "ok": true
  }
}
```

Common errors:

- `400 Bad Request`: invalid project id.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot manage the project.
- `404 Not Found`: project does not exist.

## Tasks

Task routes require authentication with either the web cookie or mobile bearer token.
Users can list, create, and update tasks only in projects where they are the owner or a member. A task can be deleted only by an admin, the project owner, the task creator, or the task assignee.

Valid task statuses are `todo`, `in_progress`, and `done`.
Valid priorities are `low`, `medium`, and `high`.
`dueDate`, when present, must be an ISO datetime string such as `2026-05-05T12:00:00.000Z`.

### List Project Tasks

```http
GET /api/projects/project-uuid/tasks
Authorization: Bearer <token>
```

Success status: `200 OK`

```json
{
  "data": {
    "tasks": [
      {
        "id": "task-uuid",
        "projectId": "project-uuid",
        "title": "Draft API contract",
        "description": "Document the task routes.",
        "status": "todo",
        "priority": "medium",
        "assigneeId": "user-uuid",
        "createdById": "creator-user-uuid",
        "dueDate": "2026-05-05T12:00:00.000Z",
        "createdAt": "2026-05-05T00:00:00.000Z",
        "updatedAt": "2026-05-05T00:00:00.000Z"
      }
    ]
  }
}
```

Common errors:

- `400 Bad Request`: invalid project id.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot access project tasks.
- `404 Not Found`: project does not exist.

### Create Task

```http
POST /api/projects/project-uuid/tasks
Content-Type: application/json
Authorization: Bearer <token>
```

Request body:

```json
{
  "title": "Draft API contract",
  "description": "Document the task routes.",
  "status": "todo",
  "priority": "medium",
  "assigneeId": "user-uuid",
  "dueDate": "2026-05-05T12:00:00.000Z"
}
```

Success status: `201 Created`

The project id comes from the URL. If `assigneeId` is provided, that user must be the project owner or a project member.

Common errors:

- `400 Bad Request`: invalid project id, invalid JSON, schema validation failure, or assignee outside the project.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot create tasks in the project.
- `404 Not Found`: project does not exist.

### Get Task

```http
GET /api/tasks/task-uuid
Authorization: Bearer <token>
```

Success status: `200 OK`

Common errors:

- `400 Bad Request`: invalid task id.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot access the task.
- `404 Not Found`: task does not exist.

### Update Task

```http
PATCH /api/tasks/task-uuid
Content-Type: application/json
Authorization: Bearer <token>
```

Request body:

```json
{
  "title": "Finalize API contract",
  "description": "Document the task routes and error states.",
  "status": "in_progress",
  "priority": "high",
  "assigneeId": null,
  "dueDate": null
}
```

Success status: `200 OK`

At least one task field is required. `description`, `assigneeId`, and `dueDate` may be set to `null`.

Common errors:

- `400 Bad Request`: invalid task id, invalid JSON, schema validation failure, or assignee outside the project.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot update tasks in the project.
- `404 Not Found`: task does not exist.

### Delete Task

```http
DELETE /api/tasks/task-uuid
Authorization: Bearer <token>
```

Success status: `200 OK`

```json
{
  "data": {
    "ok": true
  }
}
```

Common errors:

- `400 Bad Request`: invalid task id.
- `401 Unauthorized`: missing, invalid, or expired token.
- `403 Forbidden`: authenticated user cannot delete the task.
- `404 Not Found`: task does not exist.

## Shared Contracts

Reusable request validation schemas and domain contracts live in `packages/shared`.
They are platform-neutral so both the web app and mobile app can import them.

## Planned Route Areas

- Users and teams.
- Comments and activity.
- Reports.

## Notes

Authentication is implemented. Add request and response contracts here before adding additional production route handlers.
