# Project Access Control Manual Tests

Use these checks after running migrations and seeding a test database. The examples assume the web app is running locally at `http://localhost:3000` and that you can sign in through the web UI or call the API with JWT bearer tokens.

## Setup

1. Run `npm run db:migrate -w @taskflow/web`.
2. Run `npm run db:seed`.
3. Sign in as `admin@taskflow.dev / admin123`.
4. Create or identify a normal user account that is not assigned to the target project.

## Required Checks

### Assigned User Can See Project And Tasks

1. As an admin or project owner, open a project and go to **Members**.
2. Assign a normal user as `member` or `manager`.
3. Sign in as that user.
4. Confirm `GET /api/projects` includes the project.
5. Confirm `GET /api/projects/:id` returns `200`.
6. Confirm `GET /api/projects/:id/tasks` returns `200` and only tasks for that project.

### Unassigned User Cannot See Project Or Tasks

1. Remove the normal user from the project, or choose a user who is not assigned.
2. Sign in as that user.
3. Confirm `GET /api/projects` does not include the project.
4. Confirm `GET /api/projects/:id` returns `403`.
5. Confirm `GET /api/projects/:id/tasks` returns `403`.
6. Confirm `GET /api/tasks/:taskId` for a task in that project returns `403`.

### Admin Can Assign Users

1. Sign in as an admin.
2. Open a project member management page.
3. Search for an unassigned user.
4. Assign the user as `member`.
5. Confirm the user appears in the assigned members table.
6. Confirm `GET /api/projects/:id/members` includes the new member.

### Duplicate Assignment Returns 409

1. Pick a user who is already assigned to a project.
2. Send `POST /api/projects/:id/members` again with the same `userId`.
3. Confirm the response status is `409`.
4. Confirm the error envelope includes a message such as `User is already assigned to the project.`

### Removing Owner Is Blocked

1. Identify the project owner row in `GET /api/projects/:id/members`.
2. Send `DELETE /api/projects/:id/members/:ownerUserId`.
3. Confirm the response status is `400`.
4. Confirm the owner still appears in the member list.

## Notes

- Member management is allowed for admins and project owners only.
- Managers and members can view the project member list for projects they are assigned to.
- Project task, comment, and attachment endpoints must check access through the task's parent project.
