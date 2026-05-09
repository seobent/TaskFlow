# Deployment

TaskFlow deploys the Next.js web app and REST API Route Handlers from
`apps/web` to Netlify. The Expo mobile app is not deployed by Netlify; it calls
the deployed Netlify API over HTTPS.

## Netlify Configuration

The root `netlify.toml` must stay aligned with the web workspace:

```toml
[build]
  command = "npm run build --workspace apps/web"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

The `@netlify/plugin-nextjs` plugin adapts the App Router build output,
including Route Handlers under `apps/web/app/api`, for Netlify Functions.

## Deployment Steps

1. Create a Netlify site from the Git repository.
2. Confirm the build command is `npm run build --workspace apps/web`.
3. Confirm the publish directory is `apps/web/.next`.
4. Confirm the Next.js Runtime plugin is installed through `netlify.toml`.
5. Add the production environment variables in Netlify site settings.
6. Trigger a deploy and verify `/api/health` on the deployed URL.
7. Configure the mobile app with the deployed API URL before building Expo
   artifacts.

## Environment Variables

Configure these values in Netlify site settings for production:

```text
DATABASE_URL=<neon-postgres-url>
JWT_SECRET=<strong-production-secret>
NEXT_PUBLIC_API_URL=https://your-netlify-site.netlify.app
NODE_ENV=production
```

- `DATABASE_URL` is the Neon PostgreSQL connection string used only by
  server-side web code.
- `JWT_SECRET` signs and verifies authentication tokens and must be a strong
  production-only secret.
- `NEXT_PUBLIC_API_URL` is safe to expose because it is only the public web/API
  origin, not a credential.
- `NODE_ENV` should be `production` in production so secure cookie behavior is
  enabled.

Never prefix `DATABASE_URL` or `JWT_SECRET` with `NEXT_PUBLIC_`, never add real
secret values to documentation, and never commit `.env` or `.env.local` files.

## Backend API

API routes live in `apps/web/app/api` and are deployed with the web app. They
use Next.js Route Handlers on `/api/...`, derive the acting user from JWT
cookies or bearer tokens, and keep Neon access on the server side only.

After deployment, confirm the API is reachable:

```bash
curl https://your-netlify-site.netlify.app/api/health
```

## Production Database Migration

Drizzle migrations are generated and committed in the repository under
`apps/web/drizzle`. The production Neon database must be migrated before the
deployed app is used.

Do not automatically run migrations on every Netlify build. Netlify builds
should compile and deploy the web app only. Production migrations should be run
manually and intentionally against the production `DATABASE_URL` after reviewing
the committed migration files.

From `apps/web`, run:

```bash
DATABASE_URL="production_neon_url" npm run db:migrate
```

Run the seed script once after the production migration if demo credentials are
needed:

```bash
DATABASE_URL="production_neon_url" npm run db:seed
```

The seed creates these demo credentials:

```text
Admin:
admin@taskflow.dev
admin123

User:
demo@taskflow.dev
demo123
```

## Mobile Configuration

Set the Expo public API URL to the deployed Netlify API base URL:

```text
EXPO_PUBLIC_API_URL=https://your-netlify-site-name.netlify.app
```

Only the API URL should be exposed to the mobile app. Do not add Neon database
connection strings, JWT secrets, or other server-only values to Expo
environment variables.

## Production Checklist

- `npm run build --workspace apps/web` succeeds locally before deployment.
- Netlify uses Node.js 20 and the root `netlify.toml` settings above.
- `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, and `NODE_ENV` are set in
  Netlify.
- `DATABASE_URL` and `JWT_SECRET` are server-only and are not committed.
- `.env.local` remains ignored by Git.
- Drizzle migrations are committed in `apps/web/drizzle`.
- Production Drizzle migrations have been reviewed and manually applied to the
  production Neon database before using the deployed app.
- Production database migrations are not run automatically on every Netlify
  build.
- The seed script has been run once if demo credentials are required.
- `/api/health` responds successfully on the deployed Netlify URL.
- Protected API routes return `401 Unauthorized` without a valid JWT.
- Web login sets an httpOnly cookie with secure production settings.
- Production mobile testing uses `EXPO_PUBLIC_API_URL=https://your-netlify-site-name.netlify.app`.
