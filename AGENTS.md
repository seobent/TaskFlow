# TaskFlow Agent Guide

TaskFlow is a university capstone scaffold for a multi-platform project and issue tracking system. Keep changes small, documented, and aligned with the existing npm workspace layout.

## Project Boundaries

- Do not add business logic until the assignment scope calls for it.
- Keep shared code in `packages/shared` limited to reusable TypeScript types, constants, and helpers.
- Keep backend API work in Next.js Route Handlers under `apps/web/app/api`.
- Keep mobile API configuration environment-driven through `EXPO_PUBLIC_API_URL`.

## Common Commands

```bash
npm install
npm run dev:web
npm run dev:mobile
npm run typecheck
npm run build
```

## Workspace Notes

- `apps/web` is a Next.js App Router app using TypeScript and Tailwind CSS.
- `apps/mobile` is an Expo React Native app using TypeScript.
- `packages/shared` is a shared TypeScript package consumed by both apps.
- Netlify deploys the web app from the repository root with `npm run build:web`.

## Documentation

Update the relevant file in `docs/` when a change affects architecture, database design, API shape, setup, deployment, or screenshots.
