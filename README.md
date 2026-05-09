
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

The mobile app reads its API base URL from `EXPO_PUBLIC_API_URL`.

- If you are using an emulator/simulator on the same machine, `http://localhost:3000` is fine.
- If you are using a physical device, `localhost` refers to the phone. Use your computer's LAN IP instead (the same IP Expo prints in the QR URL), for example `http://192.168.2.100:3000`.
- For production mobile builds, point it at the deployed Netlify API URL, for example `https://your-netlify-site-name.netlify.app`.
- The Expo mobile app uses the deployed Netlify API in production; it never connects directly to the database.

The web app reads server-side database settings from `apps/web/.env.local`:

```text
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

After applying migrations, seed local demo data:

```bash
npm run db:seed
```

The seed creates `admin@taskflow.dev` with password `admin123` and
`demo@taskflow.dev` with password `demo123`, plus demo projects, members,
tasks, and comments. The command is safe to rerun.

Type-check all workspaces:

```bash
npm run typecheck
```

## Deployment

TaskFlow deploys `apps/web` to Netlify. The root `netlify.toml` is configured
for the web workspace:

```toml
[build]
  command = "npm run build --workspace apps/web"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Set these production environment variables in Netlify site settings:

```text
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_API_URL=https://your-netlify-site.netlify.app
NODE_ENV=production
```

`DATABASE_URL` and `JWT_SECRET` are server-only secrets. Do not prefix them with
`NEXT_PUBLIC_`, do not expose them to Expo, and do not commit `.env` or
`.env.local` files. The `.gitignore` file ignores `.env.local`.

Before deploying, run:

```bash
npm run build --workspace apps/web
```

After deployment, verify `https://your-netlify-site.netlify.app/api/health`.
Configure production mobile builds with:

```text
EXPO_PUBLIC_API_URL=https://your-netlify-site-name.netlify.app
```

Production checklist:

- Netlify uses Node.js 20, the configured web workspace build command, and the
  `@netlify/plugin-nextjs` plugin.
- Netlify has `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, and
  `NODE_ENV=production` configured.
- No real secrets are committed or documented.
- Drizzle migrations are reviewed and applied to the production Neon database.
- The deployed `/api/health` route responds successfully.
- Protected API routes still require JWT authentication.
- Mobile production builds point `EXPO_PUBLIC_API_URL` to the deployed Netlify
  API URL.

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
