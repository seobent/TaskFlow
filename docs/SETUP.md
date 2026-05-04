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
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Run Locally

```bash
npm run dev:web
npm run dev:mobile
```

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
