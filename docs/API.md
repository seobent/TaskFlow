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

## Shared Contracts

Reusable request validation schemas and domain contracts live in `packages/shared`.
They are platform-neutral so both the web app and mobile app can import them.

## Planned Route Areas

- Users and teams.
- Projects.
- Issues.
- Comments and activity.
- Reports.

## Notes

Authentication is implemented. Add request and response contracts here before adding additional production route handlers.
