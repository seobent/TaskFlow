
# TaskFlow

TaskFlow is a multi-platform project and issue tracking system for a university capstone assignment. The goal is to help student teams, instructors, and project reviewers plan work, track issues, document progress, and keep capstone delivery transparent across web and mobile.

This repository is intentionally at the scaffold stage. It defines the monorepo, application shells, shared TypeScript package, project documentation, and the initial Drizzle/Neon database schema. JWT authentication API handlers are implemented under the web app; broader project and issue business logic will be added later.

## Technology Stack

- Monorepo: npm workspaces
- Web: Next.js App Router, React, TypeScript, Tailwind CSS
- Mobile: Expo, React Native, TypeScript
- Shared code: TypeScript and Zod package for common types, constants, and validation contracts
- Database: Neon PostgreSQL with Drizzle ORM
- Planned API: Next.js Route Handlers under `apps/web/app/api`
- Planned deployment: Netlify for the web app and backend API, Expo tooling for mobile

## Repository Layout

```text
taskflow/
  apps/
    web/               Next.js App Router application
    mobile/            Expo React Native application
  packages/
    shared/            Shared TypeScript types and validation schemas
  docs/                Architecture, API, database, setup, deployment, screenshots
  AGENTS.md            Contributor and coding-agent guidance
  package.json         npm workspace root
  netlify.toml         Netlify build configuration
  tsconfig.base.json   Shared TypeScript compiler settings
```

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Run the web app:

```bash
npm run dev:web
```

Run the mobile app:

```bash
npm run dev:mobile
```

The mobile app reads its API base URL from `EXPO_PUBLIC_API_URL`. During local development, point it at the web app API, for example `http://localhost:3000/api`.

The web app reads server-side database settings from `apps/web/.env.local`:

```text
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Type-check all workspaces:

```bash
npm run typecheck
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Setup](docs/SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Screenshots](docs/SCREENSHOTS.md)

## Current Status

- Monorepo structure is in place.
- Web and mobile app shells are present and can be run locally after dependency installation.
- Initial Drizzle schema and migration are present for Neon PostgreSQL.
- JWT authentication routes are implemented for register, login, logout, and current-user lookup.
- Shared package contains common enums, domain types, and Zod validation schemas.
- Documentation skeletons describe the planned system.
- Project and issue API business logic has not been implemented yet.
