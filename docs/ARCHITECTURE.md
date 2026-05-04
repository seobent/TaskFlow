# Architecture

TaskFlow is organized as an npm workspace monorepo with separate web, mobile, and shared package workspaces.

## Applications

- `apps/web`: Next.js App Router application for the browser UI and backend Route Handlers.
- `apps/mobile`: Expo React Native application for mobile clients.
- `packages/shared`: Shared TypeScript and Zod package for cross-platform enums, types, constants, and validation schemas.

## Backend Boundary

The backend API will live inside `apps/web/app/api` as Next.js Route Handlers. Netlify will deploy the web app and these route handlers together.

## Mobile API Boundary

The mobile app will communicate with the deployed Netlify API URL through `EXPO_PUBLIC_API_URL`.

## Future Work

- Authentication and authorization design.
- Database schema and migrations.
- API route contracts.
- UI workflow design for projects, issues, teams, and reporting.
