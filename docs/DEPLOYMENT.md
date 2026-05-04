# Deployment

TaskFlow is configured for Netlify deployment of the Next.js web app and backend API route handlers.

## Netlify

The root `netlify.toml` uses:

```text
command = "npm run build:web"
publish = "apps/web/.next"
```

The Netlify Next.js plugin is configured in `netlify.toml`.

## Environment Variables

Add production values in the Netlify site settings before deploying.

- `NEXT_PUBLIC_APP_ENV`
- `TASKFLOW_DATABASE_URL`
- `TASKFLOW_AUTH_SECRET`

## Backend API

Backend routes will be deployed from `apps/web/app/api`. The mobile app should point to the deployed API URL:

```text
EXPO_PUBLIC_API_URL=https://your-netlify-site.netlify.app/api
```

## Mobile

The Expo app is not deployed by Netlify. Configure the API URL before building or running the mobile app with Expo tooling.
