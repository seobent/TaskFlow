
# TaskFlow

TaskFlow is a multi-platform project and issue tracking system for a university capstone assignment. The goal is to help student teams, instructors, and project reviewers plan work, track issues, document progress, and keep capstone delivery transparent across web and mobile.

This repository is intentionally at the scaffold stage. It defines the monorepo, application shells, shared TypeScript package, and project documentation. Business logic, database migrations, authentication, and production API handlers will be added later.

## Technology Stack

- Monorepo: npm workspaces
- Web: Next.js App Router, React, TypeScript, Tailwind CSS
- Mobile: Expo, React Native, TypeScript
- Shared code: TypeScript and Zod package for common types, constants, and validation contracts
- Planned database: PostgreSQL
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
- Shared package contains common enums, domain types, and Zod validation schemas.
- Documentation skeletons describe the planned system.
- No business logic has been implemented yet.
