# TaskFlow Agent Guide

This file defines how AI coding agents must work in the TaskFlow repository. Treat it as the project architecture contract. Keep changes small, typed, documented, and aligned with the monorepo boundaries below.

## 1. Project Context

- The project name is TaskFlow.
- TaskFlow is a multi-platform project and issue tracking system.
- TaskFlow allows users and admins to manage projects, tasks/issues, comments, assignments, statuses, priorities, and teams from both a web app and a mobile app.
- The repository is a monorepo.
- `apps/web` contains both the web frontend and the backend REST API.
- `apps/mobile` contains only the mobile client.
- Implement only the requested scope. Do not add unrelated business logic, data models, UI flows, packages, or infrastructure.
- Prefer practical, maintainable code over clever abstractions.

## 2. Technology Stack

- Use TypeScript everywhere.
- Web app: Next.js App Router in `apps/web`.
- Web styling: Tailwind CSS.
- Backend API: Next.js Route Handlers in `apps/web/app/api`.
- Mobile app: React Native with Expo in `apps/mobile`.
- Mobile navigation: Expo Router or React Navigation.
- Database: Neon PostgreSQL.
- ORM and database access: Drizzle ORM.
- Authentication: JWT.
- Web JWT storage: httpOnly cookies.
- Mobile JWT storage: Expo SecureStore.
- Deployment: Netlify for `apps/web`.
- Shared code: `packages/shared` for reusable TypeScript types, constants, validation schemas, and API contracts.

## 3. Monorepo Structure

Expected structure:

```text
apps/
  web/
    app/
      api/
    ...
  mobile/
    ...
packages/
  shared/
docs/
```

- `apps/web` owns the Next.js web application, REST API Route Handlers, server-side authentication, and Drizzle database access.
- `apps/mobile` owns React Native screens, navigation, mobile API calls, and SecureStore token handling.
- `packages/shared` contains shared TypeScript types, request/response contracts, constants, and validation schemas when they are safe for both web and mobile.
- `docs` contains project documentation, architecture notes, database documentation, setup guides, deployment notes, API documentation, and screenshots.
- Do not import server-only code from `apps/web` into `apps/mobile`.
- Do not put database access, Drizzle schemas, or secret-dependent logic in `packages/shared`.
- Keep shared code platform-neutral and free of secrets.

## 4. Netlify Deployment Rules

- Deploy `apps/web` to Netlify.
- Keep Netlify build settings aligned with the web app location and repository scripts.
- Netlify must provide server-only environment variables such as:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - any other server-only secrets
- Do not prefix server-only variables with `NEXT_PUBLIC_`.
- Do not expose Neon connection strings, JWT secrets, or service credentials to browser JavaScript or the mobile app.
- Ensure Next.js Route Handlers under `apps/web/app/api` work correctly in the Netlify deployment.
- The mobile app must call the deployed Netlify API URL. It must not call a database directly.
- Update deployment documentation when build commands, environment variables, Netlify configuration, or deployment behavior changes.

## 5. Neon Database Rules

- Use Neon PostgreSQL as the database.
- Only server-side code in `apps/web` may connect to Neon.
- Never connect to Neon from `apps/mobile`.
- Never expose Neon connection strings to frontend client components, mobile code, logs, screenshots, or documentation examples with real values.
- Store database connection configuration in environment variables.
- Use least-privilege credentials where practical.
- Use foreign keys for relationships.
- Add indexes for frequently queried fields, joins, and authorization checks.
- Include timestamps such as `createdAt` and `updatedAt` on persistent domain tables.
- Use soft delete only if the project explicitly implements it and documents the behavior.

## 6. Drizzle ORM Migration Rules

- Use Drizzle ORM for schema definitions and database access.
- Store schema definitions in a clear database folder under server-owned code in `apps/web`.
- Every schema change must use a Drizzle migration.
- Commit generated migration files together with the related schema and application code.
- Never manually edit the production database schema.
- Never rely on ad hoc SQL changes that are not represented in committed migrations.
- Review migrations before applying them, especially destructive changes.
- Use safe migration practices:
  - avoid dropping columns or tables without a deliberate compatibility plan
  - backfill data before enforcing new non-null constraints when needed
  - add indexes intentionally
  - preserve existing data unless the task explicitly requires deletion
- Keep database documentation updated after schema changes.

## 7. Authentication Rules

- Use JWT authentication.
- Passwords must be hashed securely before storage.
- Never store plain text passwords.
- Never return `passwordHash` in API responses.
- JWT payloads must contain only necessary data, such as authenticated user id, role, issued time, and expiration.
- Validate JWTs on every protected API route.
- Web requests authenticate with an httpOnly cookie.
- Mobile requests authenticate with an `Authorization: Bearer <token>` header.
- API authentication helpers must support both cookie-based web requests and bearer-token mobile requests.
- Web JWT cookies must be httpOnly and secure in production.
- Do not expose web JWTs to browser JavaScript unless a task explicitly requires it and the security tradeoff is documented.
- Mobile JWTs must be stored with Expo SecureStore, not AsyncStorage or plain local storage.
- Handle token expiration and unauthorized responses consistently in both clients.

## 8. Authorization Rules

- Supported roles are `user` and `admin`.
- Authorization must be enforced on the server/API side.
- Do not rely on hidden UI buttons, disabled controls, or mobile navigation guards as the only access control.
- Admins can manage users, projects, and global settings.
- Users can access only projects and issues they are assigned to or otherwise allowed to view.
- API handlers and server-side services must check permissions before reading, creating, updating, or deleting data.
- Never trust client-provided `userId`, `role`, `projectId`, `organizationId`, ownership, assignment, or membership data without checking it against the authenticated user.
- Derive the acting user from the validated JWT.
- Use database queries that include authorization constraints where practical.

## 9. REST API Rules

- REST API routes must live in `apps/web` using Next.js Route Handlers.
- API route files must be under `apps/web/app/api`.
- API paths must use `/api/...`.
- API endpoints must be usable by both the web app and the mobile app.
- Use consistent JSON response shapes for success and error responses.
- Use consistent HTTP status codes and error messages.
- Validate all request bodies, route params, and query params.
- Never trust client-provided identity, role, ownership, or permission fields.
- Derive the authenticated user from the JWT.
- Check authorization before reading or modifying data.
- Never return `passwordHash`, secrets, internal tokens, or sensitive infrastructure details.
- Keep API logic out of React components.
- Prefer shared validation schemas and request/response types from `packages/shared` when they are safe for client use.
- Avoid duplicating API behavior separately for web and mobile.

## 10. Web UI Rules

- Use Next.js App Router in `apps/web`.
- Use server components where appropriate.
- Use client components only when interactivity, browser APIs, or client-side state require them.
- Use Tailwind CSS for styling.
- Keep UI components clean, reusable, and focused.
- Keep business logic out of React components when possible.
- Store the web JWT in httpOnly cookies.
- Do not manually expose JWTs to browser JavaScript unless absolutely necessary and documented.
- Web UI may call internal API routes or server-side services when appropriate.
- Do not import mobile-only code into the web app.
- Do not place secrets in client components, public environment variables, or bundled code.
- Ensure UI state does not imply authorization. The API must enforce authorization.

## 11. Mobile App Rules

- Build the mobile app with React Native and Expo in `apps/mobile`.
- Use Expo Router or React Navigation for navigation.
- The mobile app is an API client only.
- The mobile app must communicate only with the deployed Netlify API or a configured local API during development.
- Use environment variables for the API base URL, such as `EXPO_PUBLIC_API_URL`.
- Use only public mobile environment variables that are safe to ship to devices.
- Never connect directly to PostgreSQL from the mobile app.
- Never use Drizzle directly in the mobile app.
- Never import Drizzle schemas, database clients, or server-only modules.
- Store JWTs with Expo SecureStore.
- Use `fetch` or a typed API client to communicate with the API.
- Send mobile authentication as `Authorization: Bearer <token>`.
- Handle token expiration, `401 Unauthorized`, and `403 Forbidden` responses properly.
- Keep mobile screens focused on presentation, navigation, local UI state, and API client calls.

## 12. Shared API/Client Rules

- Use `packages/shared` for TypeScript types, constants, validation schemas, and API request/response contracts that are safe to share.
- Shared code must not depend on Next.js server APIs, Drizzle, Neon, Expo SecureStore, Node-only APIs, or secrets.
- Keep shared contracts stable and explicit.
- Prefer shared validation schemas for API input when they can be used safely by both clients and the server.
- Avoid duplicating API types between `apps/web` and `apps/mobile`.
- If adding a typed API client, keep it environment-driven so web and mobile can provide different base URLs and auth mechanisms.
- Shared code must not assume whether authentication comes from a cookie or bearer token.

## 13. Security Rules

- Never commit `.env` files or real secret values.
- Never expose secrets in frontend or mobile code.
- Never expose Neon connection strings outside server-side code and deployment configuration.
- Use environment variables for `DATABASE_URL`, `JWT_SECRET`, and other secrets.
- Passwords must be hashed securely.
- Validate all request bodies, query params, route params, and uploaded content.
- Sanitize user-generated content where needed before rendering or returning it.
- Apply rate limiting or abuse protection where appropriate, especially for authentication endpoints.
- Use secure cookie settings in production:
  - `httpOnly`
  - `secure`
  - appropriate `sameSite`
  - appropriate expiration
- Avoid logging passwords, JWTs, cookies, connection strings, or personally sensitive data.
- Keep error messages useful but avoid leaking implementation details.
- Treat all client input as untrusted.

## 14. Code Quality Rules

- Use TypeScript throughout the repository.
- Do not ignore TypeScript errors.
- Keep files reasonably small and focused.
- Prefer clear, simple, maintainable code.
- Keep business logic out of React components when possible.
- Use validation schemas for API input.
- Add useful error handling.
- Avoid duplicated API logic between web and mobile.
- Use shared types from `packages/shared` where appropriate.
- Follow existing project patterns before introducing new abstractions.
- Add comments only when they clarify non-obvious behavior.
- Keep formatting consistent with the repository.
- Run the relevant checks before finishing changes when practical.

Common commands:

```bash
npm install
npm run dev:web
npm run dev:mobile
npm run typecheck
npm run build
```

## 15. Git Commit Rules

- Make small, focused commits.
- Use clear commit messages that describe the reason for the change.
- Commit Drizzle migrations together with the related schema and application code.
- Do not commit secrets.
- Do not commit `.env` files.
- Do not commit generated build folders, dependency folders, caches, or local tooling output.
- Do not rewrite unrelated code while making a focused change.
- Preserve user work and unrelated local changes.
- Update documentation in the same change when architecture, API shape, database schema, setup, deployment, or screenshots change.

## 16. Documentation Rules

- Keep documentation in `docs` and `README.md`.
- Update documentation after important changes.
- Document the project description and architecture.
- Document the database schema and migration expectations.
- Document the REST API overview, authentication behavior, authorization rules, request formats, response formats, and error formats.
- Document local development setup.
- Document required environment variables without exposing real secret values.
- Document Netlify deployment steps and configuration.
- Document key folders and files.
- Document mobile app setup, including API base URL configuration and SecureStore token behavior.
- Document testing and verification instructions.
- Keep screenshots documentation updated when UI changes are visible or screenshots are part of the assignment.
