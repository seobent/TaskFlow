# Deployment

TaskFlow deploys the Next.js web frontend and REST API backend from `apps/web` to Netlify. The Expo mobile app is configured separately and calls the deployed Netlify API over HTTPS.

## Netlify Deployment

1. Push the repository to GitHub or another Git provider supported by Netlify.
2. Create a new Netlify site from the repository.
3. Confirm the build command and publish directory match `netlify.toml`.
4. Add production environment variables in Netlify site settings.
5. Deploy the site.
6. Verify the deployed API health endpoint.
7. Configure Expo production builds with the deployed Netlify URL.

## Netlify Build Settings

The root `netlify.toml` contains the required settings:

```toml
[build]
  command = "npm run build --workspace apps/web"
  publish = "apps/web/.next"

[build.environment]
  NPM_FLAGS = "--include=dev"
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[dev]
  command = "npm run dev:web"
  port = 8888
  targetPort = 3000
```

Netlify should use:

```text
Base directory: repository root
Build command: npm run build --workspace apps/web
Publish directory: apps/web/.next
Node version: 20
Next.js plugin: @netlify/plugin-nextjs
```

The Next.js plugin adapts App Router pages and Route Handlers under `apps/web/src/app/api` for Netlify.

## Netlify Environment Variables

Set these values in Netlify site settings:

```text
DATABASE_URL=<production-neon-postgres-url>
JWT_SECRET=<strong-production-secret>
NEXT_PUBLIC_API_URL=https://your-taskflow-demo.netlify.app
MOBILE_WEB_ORIGIN=https://your-mobile-web-preview.example.com
NODE_ENV=production
```

Set these only if attachment uploads are enabled:

```text
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key-id>
R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
R2_BUCKET_NAME=<r2-bucket-name>
R2_PUBLIC_URL=https://files.example.com
```

Variable rules:

- `DATABASE_URL` is server-only and must point to the production Neon database.
- `JWT_SECRET` is server-only and must be a strong production secret.
- `NEXT_PUBLIC_API_URL` is public and should be the deployed Netlify origin.
- `MOBILE_WEB_ORIGIN` is server-only and only required when an Expo Web deployment calls the API from a different origin.
- `NODE_ENV=production` enables secure production cookie behavior.
- R2 credential variables are server-only and must not use `NEXT_PUBLIC_`.
- `R2_PUBLIC_URL` is returned in attachment metadata and should be a public file URL origin.

Never commit real environment variable values to the repository.

## Neon Production Database

Use a dedicated Neon production database or production branch. Keep local development and production data separated.

Recommended production database process:

1. Create or select the production Neon database branch.
2. Store its connection string only in Netlify and in the shell used to run production migrations.
3. Review committed files in `apps/web/drizzle`.
4. Apply migrations intentionally.
5. Seed demo users only when the capstone demo requires them.

The web app and API connect to Neon from server-side code only. The mobile app must call the Netlify API and must never receive the Neon connection string.

## Production Migration Command

Run production migrations manually after reviewing the migration SQL:

```bash
DATABASE_URL="production_neon_url" npm run db:migrate -w @taskflow/web
```

PowerShell equivalent:

```powershell
$env:DATABASE_URL="production_neon_url"
npm run db:migrate -w @taskflow/web
```

Do not automatically run migrations on every Netlify build. A deployment build should compile and deploy the application; schema changes should be reviewed separately.

## Seed Demo Users

For a university capstone demo, seed the production database after migrations:

```bash
DATABASE_URL="production_neon_url" npm run db:seed
```

PowerShell equivalent:

```powershell
$env:DATABASE_URL="production_neon_url"
npm run db:seed
```

Seeded credentials:

```text
Admin:
admin@taskflow.dev
admin123

User:
demo@taskflow.dev
demo123
```

The seed script also creates demo projects, project memberships, tasks, and comments. It is idempotent and uses fixed IDs with upsert logic.

If the public demo is long-lived, change demo passwords or restrict access according to the review requirements.

## Mobile EXPO_PUBLIC_API_URL Configuration

Production mobile builds must point to the deployed Netlify API origin:

```text
EXPO_PUBLIC_API_URL=https://your-taskflow-demo.netlify.app
```

The mobile client appends `/api/...` paths internally. Do not put `DATABASE_URL`, `JWT_SECRET`, R2 credentials, or any server-only values in Expo environment variables.

## Post-Deploy Verification

Check the health endpoint:

```bash
curl https://your-taskflow-demo.netlify.app/api/health
```

Expected response:

```json
{
  "data": {
    "ok": true,
    "service": "taskflow-web",
    "version": "0.1.0"
  }
}
```

Verify core workflows:

- Web registration creates a user and sets an httpOnly cookie.
- Web login works with seeded credentials.
- `/api/auth/me` returns the current user when authenticated.
- Protected API routes return `401 Unauthorized` without a valid JWT.
- Admin routes return `403 Forbidden` for non-admin users.
- Project and task pages load seeded records.
- Comments can be created on accessible tasks.
- Attachment uploads succeed only when R2 variables are configured.
- Mobile login works with `EXPO_PUBLIC_API_URL` set to the Netlify URL.
- Mobile role-based bottom tabs render correctly after login.
- Mobile project, task, user directory, and profile screens load data from the deployed API.
- Mobile admin users see the Users tab; non-admin users do not.
- Mobile theme switching works on authenticated screens.

## Production Checklist

- Netlify uses the repository root as the base directory.
- Netlify build command is `npm run build --workspace apps/web`.
- Netlify publish directory is `apps/web/.next`.
- `@netlify/plugin-nextjs` is installed through `netlify.toml`.
- `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, and `NODE_ENV` are configured in Netlify.
- R2 variables are configured if attachment uploads are part of the demo.
- No `.env`, `.env.local`, Neon connection string, JWT secret, or R2 credentials are committed.
- Drizzle migrations are committed under `apps/web/drizzle`.
- Production migrations have been reviewed and applied.
- Demo users have been seeded if required.
- `https://your-taskflow-demo.netlify.app/api/health` responds successfully.
- Expo production builds use `EXPO_PUBLIC_API_URL=https://your-taskflow-demo.netlify.app`.
