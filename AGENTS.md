# TaskFlow Agent Guide

This file defines how AI coding agents must work in the TaskFlow repository. Treat it as the project architecture contract. Keep changes small, typed, documented, and aligned with the monorepo boundaries below.

## 1. Project Context

- The project name is TaskFlow.
- TaskFlow is a multi-platform project and issue tracking system for a university capstone project.
- Users and admins can manage projects, tasks/issues, comments, assignments, statuses, priorities, task attachments, and teams of project members from web and mobile clients.
- The repository is an npm workspace monorepo.
- `apps/web` contains the Next.js web frontend and the backend REST API.
- `apps/mobile` contains the Expo mobile client only.
- `packages/shared` contains platform-neutral TypeScript types, constants, enums, and Zod validation schemas.
- Implement only the requested scope. Do not add unrelated business logic, data models, UI flows, packages, or infrastructure.
- Prefer practical, maintainable code over clever abstractions.

## 2. Implemented Technology Stack

- Language: TypeScript everywhere.
- Web app: Next.js App Router in `apps/web`.
- Web styling: Tailwind CSS.
- Backend API: Next.js Route Handlers in `apps/web/src/app/api`.
- Mobile app: React Native with Expo in `apps/mobile`.
- Mobile navigation: Expo Router.
- Database: Neon PostgreSQL.
- ORM and database access: Drizzle ORM in `apps/web`.
- Authentication: JWT.
- Password hashing: bcrypt.
- Web JWT storage: httpOnly cookie named `taskflow_token`.
- Mobile JWT storage: Expo SecureStore.
- Object storage: optional Cloudflare R2 or S3-compatible storage for task attachment file bytes.
- Deployment: Netlify for `apps/web`.
- Shared code: `packages/shared`.

## 3. Monorepo Structure

```text
apps/
  web/
    src/
      app/
        api/
        dashboard/
        login/
        register/
      components/
      db/
      lib/
    drizzle/
  mobile/
    src/
      app/
      components/
      lib/
packages/
  shared/
    src/
docs/
```

- `apps/web/src/app/api` owns API Route Handlers.
- `apps/web/src/db/schema.ts` owns Drizzle table definitions.
- `apps/web/src/db/seed.ts` owns idempotent demo seed data.
- `apps/web/drizzle` owns generated migrations.
- `apps/web/src/lib/auth.ts` owns JWT, cookie, password, and current-user helpers.
- `apps/web/src/lib/r2-storage.ts` owns R2/S3-compatible upload logic.
- `apps/mobile/src/lib/api.ts` owns the mobile API client.
- `apps/mobile/src/lib/auth-storage.ts` owns SecureStore token persistence.
- `packages/shared/src/index.ts` owns shared enums, types, constants, and Zod schemas.

Do not import server-only web code into mobile or shared packages. Do not put Drizzle, Neon, JWT secrets, R2 credentials, Node-only APIs, or secret-dependent logic in `packages/shared`.

## 4. Implemented Domain Model

Database tables:

- `users`
- `projects`
- `project_members`
- `tasks`
- `comments`
- `attachments`

Application enum values:

- User roles: `user`, `admin`
- Project member roles: `member`, `manager`
- Task statuses: `todo`, `in_progress`, `done`
- Task priorities: `low`, `medium`, `high`

Attachment metadata is stored in PostgreSQL. Attachment file bytes are uploaded to R2/S3-compatible object storage when configured.

## 5. API Surface

All API routes live under `/api/...` in `apps/web/src/app/api`.

Implemented routes:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/[id]`
- `PATCH /api/projects/[id]`
- `DELETE /api/projects/[id]`
- `GET /api/projects/[id]/tasks`
- `POST /api/projects/[id]/tasks`
- `GET /api/tasks/[taskId]`
- `PATCH /api/tasks/[taskId]`
- `DELETE /api/tasks/[taskId]`
- `GET /api/tasks/[taskId]/comments`
- `POST /api/tasks/[taskId]/comments`
- `GET /api/tasks/[taskId]/attachments`
- `POST /api/tasks/[taskId]/attachments`
- `DELETE /api/comments/[commentId]`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/[id]/role`
- `GET /api/admin/projects`
- `DELETE /api/admin/projects/[id]`

Use consistent response envelopes:

```json
{ "data": {} }
```

```json
{ "error": { "message": "Invalid request body." } }
```

Validate request bodies, route params, and query params. Prefer shared Zod schemas from `packages/shared` when they are safe for both clients and server.

## 6. Authentication Rules

- Use JWT authentication.
- Passwords must be hashed securely before storage.
- Never store plain text passwords.
- Never return `passwordHash` in API responses.
- JWT payloads must contain only necessary data, currently user id in `sub` and role.
- Validate JWTs on every protected API route.
- Web requests authenticate with the `taskflow_token` httpOnly cookie.
- Mobile requests authenticate with `Authorization: Bearer <token>`.
- API auth helpers must support both cookie-based web requests and bearer-token mobile requests.
- Web JWT cookies must be httpOnly and secure in production.
- Do not expose web JWTs to browser JavaScript.
- Mobile JWTs must be stored with Expo SecureStore, not AsyncStorage or plain local storage.
- Handle token expiration and unauthorized responses consistently in both clients.

## 7. Authorization Rules

- Supported global roles are `user` and `admin`.
- Authorization must be enforced on the server/API side.
- Do not rely on hidden UI buttons, disabled controls, or mobile navigation guards as the only access control.
- Admins can manage users and all projects.
- Users can access only projects they own or where they have a `project_members` row.
- Project owners can manage their projects.
- Project participants can list, create, and update tasks in their projects.
- Task deletion is allowed for admins, project owners, task creators, and task assignees.
- Comment deletion is allowed for comment authors and admins.
- Attachment list and upload are allowed for admins and project participants.
- Never trust client-provided `userId`, `role`, `projectId`, ownership, assignment, or membership data without checking it against the authenticated user.
- Derive the acting user from the validated JWT.

## 8. Netlify Deployment Rules

- Deploy `apps/web` to Netlify.
- Keep Netlify build settings aligned with `netlify.toml`.
- Current build command: `npm run build --workspace apps/web`.
- Current publish directory: `apps/web/.next`.
- Use Node.js 20 and `@netlify/plugin-nextjs`.
- Netlify must provide server-only environment variables such as `DATABASE_URL`, `JWT_SECRET`, and optional R2 credentials.
- Do not prefix server-only variables with `NEXT_PUBLIC_`.
- Ensure Next.js Route Handlers under `apps/web/src/app/api` work correctly in Netlify.
- The mobile app must call the deployed Netlify API URL through `EXPO_PUBLIC_API_URL`.
- Update deployment documentation when build commands, environment variables, Netlify configuration, or deployment behavior changes.

## 9. Neon And Drizzle Rules

- Use Neon PostgreSQL as the database.
- Only server-side code in `apps/web` may connect to Neon.
- Never connect to Neon from `apps/mobile`.
- Never expose Neon connection strings to frontend client components, mobile code, logs, screenshots, or documentation examples with real values.
- Store database connection configuration in environment variables.
- Use foreign keys for relationships.
- Add indexes for frequently queried fields, joins, and authorization checks.
- Include timestamps such as `createdAt` and `updatedAt` on persistent domain tables where appropriate.
- Every schema change must use a Drizzle migration.
- Commit generated migration files together with related schema and application code.
- Never manually edit the production database schema.
- Review migrations before applying them, especially destructive changes.
- Keep `docs/DATABASE.md` updated after schema changes.

## 10. Object Storage Rules

- Task attachment uploads use R2/S3-compatible storage through server-side web code.
- Required storage variables are `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL`.
- R2 credentials are server-only. Never expose them to browser JavaScript, mobile code, screenshots, or docs with real values.
- Validate file type and size before upload.
- Store attachment metadata in the `attachments` table.
- Do not store uploaded file bytes in PostgreSQL.

## 11. Web UI Rules

- Use Next.js App Router in `apps/web`.
- Use server components where appropriate.
- Use client components only when interactivity, browser APIs, or client-side state require them.
- Use Tailwind CSS for styling.
- Keep UI components clean, reusable, and focused.
- Keep business logic out of React components when possible.
- Store the web JWT in httpOnly cookies.
- Do not expose JWTs to browser JavaScript.
- Web UI may call internal API routes or server-side services when appropriate.
- Do not import mobile-only code into the web app.
- Do not place secrets in client components, public environment variables, or bundled code.
- Ensure UI state does not imply authorization. The API must enforce authorization.

## 12. Mobile App Rules

- Build the mobile app with React Native and Expo in `apps/mobile`.
- Use Expo Router.
- The mobile app is an API client only.
- The mobile app must communicate only with the deployed Netlify API or a configured local API during development.
- Use `EXPO_PUBLIC_API_URL` for the API base URL.
- Use only public mobile environment variables that are safe to ship to devices.
- Never connect directly to PostgreSQL from the mobile app.
- Never use Drizzle directly in the mobile app.
- Never import Drizzle schemas, database clients, or server-only modules.
- Store JWTs with Expo SecureStore.
- Use the typed API client in `apps/mobile/src/lib/api.ts` for API calls where practical.
- Send mobile authentication as `Authorization: Bearer <token>`.
- Handle token expiration, `401 Unauthorized`, and `403 Forbidden` responses properly.

## 13. Shared Code Rules

- Use `packages/shared` for TypeScript types, constants, validation schemas, and API request/response contracts that are safe to share.
- Shared code must not depend on Next.js server APIs, Drizzle, Neon, Expo SecureStore, Node-only APIs, or secrets.
- Keep shared contracts stable and explicit.
- Prefer shared validation schemas for API input when they can be used safely by both clients and the server.
- Avoid duplicating API types between `apps/web` and `apps/mobile`.
- Shared code must not assume whether authentication comes from a cookie or bearer token.

## 14. Security Rules

- Never commit `.env` files or real secret values.
- Never expose secrets in frontend or mobile code.
- Never expose Neon connection strings outside server-side code and deployment configuration.
- Use environment variables for `DATABASE_URL`, `JWT_SECRET`, and other secrets.
- Passwords must be hashed securely.
- Validate all request bodies, query params, route params, and uploaded content.
- Sanitize user-generated content where needed before rendering or returning it.
- Use secure cookie settings in production.
- Avoid logging passwords, JWTs, cookies, connection strings, R2 credentials, or personally sensitive data.
- Keep error messages useful but avoid leaking implementation details.
- Treat all client input as untrusted.

## 15. Code Quality Rules

- Use TypeScript throughout the repository.
- Do not ignore TypeScript errors.
- Keep files reasonably small and focused.
- Prefer clear, simple, maintainable code.
- Keep business logic out of React components when possible.
- Add useful error handling.
- Avoid duplicated API logic between web and mobile.
- Use shared types from `packages/shared` where appropriate.
- Follow existing project patterns before introducing new abstractions.
- Add comments only when they clarify non-obvious behavior.
- Keep formatting consistent with the repository.
- Run relevant checks before finishing changes when practical.

Common commands:

```bash
npm install
npm run dev:web
npm run dev:mobile
npm run dev:mobile:tunnel
npm run typecheck
npm run build
npm run db:migrate -w @taskflow/web
npm run db:seed
```

## 16. Git Commit Rules

- Make small, focused commits.
- Use clear commit messages that describe the reason for the change.
- Commit Drizzle migrations together with the related schema and application code.
- Do not commit secrets.
- Do not commit `.env` files.
- Do not commit generated build folders, dependency folders, caches, or local tooling output.
- Do not rewrite unrelated code while making a focused change.
- Preserve user work and unrelated local changes.
- Update documentation in the same change when architecture, API shape, database schema, setup, deployment, or screenshots change.

## 17. Documentation Rules

- Keep documentation in `docs` and `README.md`.
- Update documentation after important changes.
- Document the project description and architecture.
- Document the database schema and migration expectations.
- Document the REST API overview, authentication behavior, authorization rules, request formats, response formats, and error formats.
- Document local development setup.
- Document required environment variables with placeholders only.
- Document Netlify deployment steps and configuration.
- Document key folders and files.
- Document mobile app setup, including API base URL configuration and SecureStore token behavior.
- Document testing and verification instructions.
- Keep `docs/SCREENSHOTS.md` updated with placeholders or final image references when UI screenshots are part of the assignment.
