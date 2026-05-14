# Setup

This guide explains how to run TaskFlow locally for development, testing, and university capstone review.

## Prerequisites

- Node.js 20.11 or newer.
- npm 10 or newer.
- Git.
- A Neon PostgreSQL database, or another PostgreSQL database for local testing.
- Expo Go on a phone, or an iOS/Android simulator for mobile development.
- Optional: Cloudflare R2 or another S3-compatible bucket for testing task attachment uploads.

## Clone Repository

```bash
git clone <repository-url>
cd TaskFlow
```

## Install Dependencies

Install all npm workspace dependencies from the repository root:

```bash
npm install
```

The workspace includes:

- `@taskflow/web` in `apps/web`
- `@taskflow/mobile` in `apps/mobile`
- `@taskflow/shared` in `packages/shared`

## Configure Web Environment Variables

Create `apps/web/.env.local`:

```text
DATABASE_URL=<local-or-neon-postgres-url>
JWT_SECRET=<development-secret-at-least-32-characters>
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# Optional: production-only CORS origin if you deploy the Expo Web preview separately.
MOBILE_WEB_ORIGIN=https://your-mobile-web-preview.example.com
```

Optional attachment storage variables:

```text
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=<r2-bucket-name>
R2_PUBLIC_URL=https://files.example.com
```

Important security notes:

- Do not commit `.env.local`.
- Do not prefix `DATABASE_URL`, `JWT_SECRET`, or R2 credential variables with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_API_URL` is safe because it is only the public web/API origin.
- `MOBILE_WEB_ORIGIN` is server-only and is only needed when a deployed Expo Web preview calls the API from a different origin.

## Configure Mobile Environment Variables

Create `apps/mobile/.env`:

```text
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For a physical phone, `localhost` points to the phone itself. Use your computer LAN IP instead:

```text
EXPO_PUBLIC_API_URL=http://192.168.2.100:3000
```

For production mobile builds, use the Netlify URL:

```text
EXPO_PUBLIC_API_URL=https://your-taskflow-demo.netlify.app
```

Only public, non-secret mobile variables should be placed in Expo environment files.

## Neon Setup

1. Create a Neon project.
2. Create a development database branch or use the default branch for local development.
3. Copy the pooled PostgreSQL connection string.
4. Paste it into `apps/web/.env.local` as `DATABASE_URL`.
5. Keep the connection string private.

The mobile app must never receive the Neon connection string. All database access goes through the Next.js API.

## Drizzle Migrations

The Drizzle schema is defined in:

```text
apps/web/src/db/schema.ts
```

Generated migrations live in:

```text
apps/web/drizzle
```

Apply existing migrations:

```bash
npm run db:migrate -w @taskflow/web
```

After changing the schema, generate a new migration:

```bash
npm run db:generate -w @taskflow/web
```

Then review and apply it:

```bash
npm run db:migrate -w @taskflow/web
```

Optional database browser:

```bash
npm run db:studio -w @taskflow/web
```

## Seed Script

Seed demo users, projects, project memberships, tasks, and comments:

```bash
npm run db:seed
```

Seeded accounts:

```text
Admin:
admin@taskflow.dev
admin123

User:
demo@taskflow.dev
demo123
```

The seed script is idempotent. It uses fixed IDs and upserts records so it can be run repeatedly without duplicating the demo data.

## Run Web App

Start the Next.js web app and API:

```bash
npm run dev:web
```

The web app runs on:

```text
http://localhost:3000
```

The API health check is:

```text
http://localhost:3000/api/health
```

The web dev server binds to `0.0.0.0`, which allows physical mobile devices on the same network to call the API through your computer LAN IP.

## Run Mobile App

Start the web app and Expo mobile dev server together:

```bash
npm run dev
```

Start only Expo:

```bash
npm run dev:mobile
```

Start the mobile app in a browser with Expo Web:

```bash
npm run dev:mobile:web
```

Alternative tunnel mode:

```bash
npm run dev:mobile:tunnel
```

Open the app in Expo Go, a simulator, or the Expo Web browser preview. After changing `apps/mobile/.env`, restart Expo so `EXPO_PUBLIC_API_URL` is rebuilt into the app.

## Type Checking

Run TypeScript checks across all workspaces:

```bash
npm run typecheck
```

Run a production web build:

```bash
npm run build
```

## Local Verification Checklist

- `npm install` completes successfully.
- `npm run db:migrate -w @taskflow/web` applies the Drizzle migration.
- `npm run db:seed` creates the demo accounts.
- `npm run dev:web` starts the web app.
- `http://localhost:3000/api/health` returns `data.ok: true`.
- Web login works with both seeded accounts.
- Project and task pages show seeded data.
- Admin panel is available only to `admin@taskflow.dev`.
- Expo app can log in with the seeded user.
- Expo app can list projects, open project details, view tasks, update task status, and create comments.
- Attachment uploads work only when R2 variables are configured.
