# SAPHUL PMS - Feature List

## Project Overview

SAPHUL PMS is a full-stack Project Management System built with a React frontend and FastAPI backend. It supports user authentication, role-based access, project tracking, task assignment, approvals, file uploads, dashboard statistics, and activity history.

## User Roles

### Admin

- Full system-level access.
- Can create, edit, delete, and approve projects.
- Can view all projects, tasks, users, and dashboard data.
- Can create and manage users.
- Can promote members to Project Manager and demote Project Managers to Member.
- Can assign users to projects.

### Project Manager

- Can manage assigned projects.
- Can create and assign tasks inside accessible projects.
- Can approve or reject task completion requests.
- Can invite clients to project access.
- Can view project members, task progress, project files, and activity history for assigned projects.

### Member

- Can view assigned projects and assigned tasks.
- Can update assigned task status.
- Can request task approval after completing work.
- Has restricted editing access and cannot change task title or description.

### Client

- Can accept project invitation.
- Can access only assigned project data.
- Has restricted visibility and does not get global project/task access.

## Authentication and Account Features

- Login with email and password.
- Signup for new accounts.
- JWT-based authenticated sessions.
- Protected frontend routes.
- Automatic logout/redirect on unauthorized API responses.
- Forgot password and reset password flow.
- Current user profile lookup through authenticated API.
- User permissions are returned with login and stored by the frontend.

## Permission-Based Access Control

- Authorization is based on permission codes, not only role names.
- Permissions cover projects, tasks, users, files, sprints, time logs, billing, and dashboard access.
- Frontend permission gates hide or show actions based on current user permissions.
- Backend permission checks protect every sensitive API route.
- Users assigned as Project Manager on a project can receive Project Manager permissions.

## Dashboard

- Role-aware dashboard statistics.
- Total project count.
- Project status counts: pending, in progress, completed.
- Total task count.
- Task status counts: todo, in progress, done.
- Dashboard data is scoped by user access:
  - Admin sees all project/task statistics.
  - Project Manager, Member, and Client see assigned project statistics only.

## Project Management

- Create projects.
- View project list.
- Filter projects by status.
- Search projects from the frontend.
- View project details.
- Edit project details.
- Soft delete projects.
- Assign Project Manager during project creation.
- Assign multiple members during project creation.
- View project members.
- View tasks inside a project.
- View project files.
- View project activity timeline.
- View project task statistics.
- Supported project methodologies include standard project workflow plus Agile/Hybrid support for sprints.

## Project Status and Approval Workflow

- New projects start with `PENDING` status.
- Project work can move into `IN_PROGRESS`.
- Project completion can be requested.
- Completion request sets review status to pending.
- Admin can approve project completion.
- Approved projects move to `CLOSED`.
- Admin can reject project completion.
- All approval/rejection actions are tracked through backend workflow fields.

## Task Management

- Create tasks inside projects.
- View all accessible tasks.
- View individual task details.
- Search tasks from the frontend.
- Filter tasks by status.
- Filter tasks by project, multiple projects, sprint, assigned user, and task status through the API.
- Assign tasks to users.
- Edit task details.
- Soft delete tasks.
- Track task priority.
- Track start date and due date.
- Track estimated hours and actual hours.
- Support billable tasks and billing rate fields.
- Support backlog order, sprint assignment, and parent task reference.

## Task Status and Member Update Rules

- Task statuses include todo, in progress, blocked, and done.
- Assigned members can update only their own task status.
- Members cannot edit task title or description.
- Member status updates automatically update progress:
  - Todo = 0 percent.
  - In progress = 50 percent.
  - Done = 100 percent.
- Completed or under-review tasks cannot be moved backward to earlier statuses.

## Task Approval Workflow

- Assigned member marks task as done.
- Assigned member requests approval.
- Task moves to under review with pending approval status.
- Project Manager or Admin can approve the task.
- Approval sets the task to approved and progress to 100 percent.
- Project Manager or Admin can reject the task.
- Rejection updates review and approval status.
- Approval actions are logged.

## User Management

- Admin can view all users.
- Admin can create users.
- Admin can update user details.
- Admin can soft delete users.
- Admin can view user roles and permissions.
- Admin can promote Member to Project Manager.
- Admin can demote Project Manager to Member.
- Non-admin users can view limited user lists based on project membership for task assignment and display.

## Project Member Management

- Add members to projects.
- View members by project.
- View project assignments by user.
- Remove project members.
- Project membership controls project and task visibility for non-admin users.
- Project Manager assignment can grant Project Manager capabilities.

## Client Invitation Flow

- Admin or Project Manager can invite a client by email for a project.
- System generates an invitation token.
- Invitation token is valid for 7 days.
- Email sending is attempted through the email service.
- Client accepts invite using token and password.
- If the client account does not exist, it is created.
- Client role is assigned.
- Client is added as a project member.

## File Management

- Upload files against a project.
- Optionally attach files to a task.
- Store uploaded files locally under project upload folders.
- Store file metadata in the database.
- Track original filename, file type, file URL, version, uploader, and latest-file flag.
- Automatically generate file version when not provided.
- When a new latest file is uploaded, older latest files for the same project/task are unmarked.
- View files by project or task.
- Soft delete files.
- Static upload URLs are served by the backend.

## Activity Logs

- Activity logging for important project, task, and file events.
- View all activity logs.
- View activity logs by project.
- View activity logs by task.
- Logged events include create, update, delete, upload, approval requested, approved, rejected, and completion requested actions.

## Sprints

- Create sprints for Agile or Hybrid projects.
- View all sprints.
- Filter sprints by project.
- View sprint details.
- Update sprint details.
- Delete sprints.
- Sprint fields include project, name, start date, end date, and status.

## Time Logs

- Create time logs against tasks.
- View time logs.
- Filter time logs by task or user.
- Update time logs.
- Delete time logs.
- Time log fields include task, user, log date, hours, and description.
- Task actual hours are automatically recalculated when time logs are created, updated, or deleted.

## Centralized Approvals

- Create approval requests for projects or tasks.
- View approval requests.
- Filter approvals by entity type, entity ID, or status.
- Approve or reject approval requests.
- Project approvals can close projects.
- Task approvals can approve task completion.
- Approval records track requester, approver, timestamps, status, and remarks.

## Technical Features

- React 19 frontend with Vite.
- React Router protected routing.
- Axios API service with JWT interceptor.
- Bootstrap and React Bootstrap UI.
- FastAPI backend.
- SQLAlchemy ORM.
- Pydantic validation schemas.
- PostgreSQL database support.
- CORS configured for local frontend development.
- Backend health check endpoint.
- Swagger and ReDoc API documentation.
- Soft delete strategy for major business records.
- Seed scripts and test scripts available for validation/demo data.

