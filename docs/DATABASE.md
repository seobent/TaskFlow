# Database

TaskFlow uses Neon PostgreSQL with Drizzle ORM. Database schema definitions and
database access code are owned by `apps/web`; mobile code must use the REST API
and must not connect to PostgreSQL directly.

## Files

- Schema: `apps/web/db/schema.ts`
- Database client: `apps/web/db/index.ts`
- Drizzle config: `apps/web/drizzle.config.ts`
- Migrations: `apps/web/drizzle`

## Tables

- `users`: user identity, email, password hash, role, and timestamps.
- `projects`: project name, optional description, owner reference, and timestamps.
- `project_members`: project membership records with project and user references.
- `tasks`: project tasks with status, priority, assignment, creator, due date, and timestamps.
- `comments`: task comments with author references.
- `attachments`: task attachment metadata with uploader references.

## Indexes

Indexes are defined for email lookup, project ownership, project membership,
task filtering, task assignment, comment lookup, and attachment lookup.

## Commands

Run database commands from the repository root:

```bash
npm run db:generate -w @taskflow/web
npm run db:migrate -w @taskflow/web
npm run db:studio -w @taskflow/web
npm run db:seed -w @taskflow/web
```

`db:seed` is currently a placeholder.
