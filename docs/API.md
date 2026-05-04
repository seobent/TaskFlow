# API

The TaskFlow API will be implemented with Next.js Route Handlers under `apps/web/app/api`.

## Local Base URL

```text
http://localhost:3000/api
```

## Netlify Base URL

```text
https://your-netlify-site.netlify.app/api
```

## Current Routes

- `GET /api/health`: scaffold health route for deployment and local smoke checks.

## Shared Contracts

Reusable request validation schemas and domain contracts live in `packages/shared`.
They are platform-neutral so both the web app and mobile app can import them.

## Planned Route Areas

- Authentication.
- Users and teams.
- Projects.
- Issues.
- Comments and activity.
- Reports.

## Notes

No business API logic has been implemented yet. Add request and response contracts here before adding production route handlers.
