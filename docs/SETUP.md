# Setup

## Prerequisites

- Node.js 20 or newer.
- npm 10 or newer.
- Expo Go or a local mobile simulator for mobile development.

## Install Dependencies

```bash
npm install
```

## Web Environment

Copy the web example environment file:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Set local development values:

```text
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

`DATABASE_URL` should point to a Neon PostgreSQL database. Keep this value
server-only and do not prefix it with `NEXT_PUBLIC_`.

## Mobile Environment

Copy the mobile example environment file:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

For local development, set `EXPO_PUBLIC_API_URL` to the web API base URL:

```text
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Note: `localhost` only works for emulators/simulators running on the same machine.
If you are using a physical device, use your computer's LAN IP instead (the same IP Expo prints in the QR URL), for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.2.100:3000
```

## Run Locally

```bash
npm run dev:web
npm run dev:mobile
```

The web dev server binds to `0.0.0.0` so Expo on a physical device can reach
the API through your computer's LAN IP. After changing `apps/mobile/.env`,
restart Expo so the `EXPO_PUBLIC_API_URL` value is rebuilt into the app.

For production mobile builds, set `EXPO_PUBLIC_API_URL` to the deployed Netlify
API URL:

```text
EXPO_PUBLIC_API_URL=https://your-netlify-site-name.netlify.app
```

Do not add `DATABASE_URL`, `JWT_SECRET`, or other server-only values to the
mobile environment.

## Type Checking

```bash
npm run typecheck
```

## Database

Generate and apply Drizzle migrations for the web app:

```bash
npm run db:generate -w @taskflow/web
npm run db:migrate -w @taskflow/web
```

Seed the local database with demo users, projects, tasks, and comments:

```bash
npm run db:seed
```

Seeded login accounts:

```text
admin@taskflow.dev / admin123
demo@taskflow.dev / demo123
```

The seed uses bcrypt password hashes, Drizzle ORM, and fixed seed IDs so it can
be run multiple times without duplicating the demo records.
