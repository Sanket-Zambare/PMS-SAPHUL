# SAPHUL PMS - Live Flow Explanation

## Purpose

This document explains how the SAPHUL Project Management System works during a live demo or walkthrough. It is written for Project Manager review and focuses on what the user sees, what action is performed, and what happens in the system.

## 1. System Start

### Backend

The backend runs the FastAPI application and exposes all PMS APIs.

- Local backend URL: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- API documentation: `http://localhost:8000/docs`

### Frontend

The frontend runs the React/Vite application.

- Local frontend URL: `http://localhost:5173`

When the frontend loads, it checks whether a JWT token and user details exist in browser local storage. If the user is not authenticated, the system redirects to the login page.

## 2. Login Flow

1. User opens the PMS frontend.
2. User enters email and password.
3. Frontend sends login request to the backend.
4. Backend validates credentials.
5. Backend returns access token and permission list.
6. Frontend stores token, user details, and permissions.
7. User is redirected to the dashboard.

If the login fails, the frontend shows an error message. If a logged-in session later becomes unauthorized, the frontend clears saved session data and redirects back to login.

## 3. Signup Flow

1. New user opens signup page.
2. User enters name, email, password, and role-related details.
3. Frontend validates email and password format.
4. Backend creates the user account.
5. Frontend logs the user in automatically after successful signup.
6. User is redirected into the protected application.

## 4. Forgot and Reset Password Flow

1. User selects forgot password.
2. User enters registered email.
3. Backend generates reset flow response.
4. User opens reset password page with token.
5. User enters new password and confirms it.
6. Backend updates the password after token validation.
7. User can log in again using the new password.

## 5. Dashboard Flow

1. User logs in and lands on the dashboard.
2. Frontend requests dashboard statistics from the backend.
3. Backend calculates statistics based on user access.
4. Dashboard displays project and task counts.

Access behavior:

- Admin sees all project and task statistics.
- Project Manager sees data for assigned/managed projects.
- Member sees data for assigned projects and tasks.
- Client sees only assigned project data.

## 6. Project Creation Flow

1. Admin opens the Projects page.
2. Admin clicks add project.
3. Admin enters project name, description, methodology, start date, and end date.
4. Admin selects a Project Manager and members.
5. Frontend sends project creation request to the backend.
6. Backend creates project with pending status.
7. System adds selected users as project members.
8. Project appears in the project list.
9. Activity log records the project creation.

New projects are created with:

- Project status: `PENDING`
- Review status: `PENDING`

## 7. Project List and Search Flow

1. User opens Projects page.
2. Frontend requests projects from backend.
3. Backend returns projects based on user permissions and membership.
4. User can search projects by text.
5. User can filter projects by status.
6. User can open a project details page.

Visibility behavior:

- Admin can see all projects.
- Client can see only assigned projects.
- Project Manager and Member can see assigned projects.

## 8. Project Details Flow

1. User opens a project.
2. Frontend loads project details, tasks, members, users, activity logs, statistics, and files.
3. Page shows project information, task list, assigned members, file section, and activity timeline.
4. User actions are shown or hidden based on permissions.

Typical actions from this page:

- Add task.
- Edit task.
- Delete task.
- Upload project file.
- Delete file.
- Invite client.
- Approve project completion.
- View project activity.

## 9. Task Creation Flow

1. Project Manager or Admin opens Tasks page or Project Details page.
2. User clicks add task.
3. User selects project and assignee.
4. User enters task title, description, dates, priority, estimated hours, and billing details.
5. Frontend sends create task request.
6. Backend verifies project access and assignee.
7. Backend creates task.
8. Task appears in task list.
9. Activity log records task creation.

## 10. Task List Flow

1. User opens Tasks page.
2. Frontend requests tasks from backend.
3. Backend returns task list based on user role, permissions, and project membership.
4. User can search tasks.
5. User can filter tasks by status.
6. User can open task details.

Visibility behavior:

- Admin can see all tasks.
- Project Manager can see tasks in managed/assigned projects.
- Member can see assigned tasks from assigned projects.
- Client can see tasks from assigned projects only.

## 11. Member Task Update Flow

1. Member opens assigned task.
2. Member updates task status.
3. Backend confirms the user is assigned to the task.
4. Backend allows status update only.
5. Backend blocks title and description edits for members.
6. Progress is automatically updated based on status.

Progress behavior:

- Todo sets progress to 0 percent.
- In progress sets progress to 50 percent.
- Done sets progress to 100 percent.

After a task is done or under review, the system blocks backward movement to earlier statuses.

## 12. Task Approval Flow

1. Assigned member completes the task by setting status to done.
2. Member clicks request approval.
3. Backend checks that the task belongs to the member and is done.
4. Backend marks the task as under review and approval pending.
5. Project Manager or Admin reviews the task.
6. Project Manager/Admin approves or rejects the task.

Approval result:

- Approve: review status becomes approved, approval status becomes approved, progress becomes 100 percent.
- Reject: review status becomes rejected, approval status becomes rejected.

All approval actions are logged.

## 13. Project Completion Flow

1. Project Manager or authorized user requests project completion.
2. Backend checks project access and project status.
3. Project moves to completed with pending review.
4. Admin reviews completion request.
5. Admin approves or rejects the project.

Approval result:

- Approve: project review status becomes approved and project status becomes closed.
- Reject: project review status becomes rejected.

## 14. User Management Flow

1. Admin opens Users page.
2. Frontend loads all active users.
3. Admin can search users.
4. Admin can view user roles, permissions, and project assignments.
5. Admin can assign users to projects.
6. Admin can remove project assignments.
7. Admin can promote a Member to Project Manager.
8. Admin can demote a Project Manager to Member.

The system prevents users from changing their own role through the admin role-management flow.

## 15. Client Invitation Flow

1. Admin or Project Manager opens a project.
2. User enters client email and sends invitation.
3. Backend creates a secure invite token.
4. Token is valid for 7 days.
5. Email service attempts to send invitation email.
6. Client opens accept invite link.
7. Client sets password.
8. Backend creates the client account if needed.
9. Backend assigns client role.
10. Backend adds client to the project.
11. Client can now log in and view only assigned project data.

## 16. File Upload Flow

1. User with file upload permission opens project details.
2. User selects a file.
3. User optionally enters version/latest information.
4. Frontend sends multipart file upload request.
5. Backend validates project and optional task.
6. Backend saves the file in local uploads folder.
7. Backend creates file metadata in the database.
8. If file is marked latest, previous latest files for the same project/task are unmarked.
9. File appears in the project file list.
10. Activity log records the upload.

Users with file view permission can open file URLs served by the backend. Users with file delete permission can soft delete file records.

## 17. Activity Log Flow

1. System records important actions during project, task, and file operations.
2. Project details page loads project activity history.
3. Task-related activity can also be fetched separately.
4. Activity log helps reviewers see what happened, who performed it, and when it happened.

Examples of logged actions:

- Project created.
- Project updated.
- Project completion requested.
- Project approved or rejected.
- Task created.
- Task status changed.
- Task approval requested.
- Task approved or rejected.
- File uploaded.
- Record deleted.

## 18. Sprint Flow

1. User creates a sprint for an Agile or Hybrid project.
2. Backend validates that the project supports sprints.
3. Sprint is saved with name, dates, and status.
4. User can view, update, or delete sprint records based on permissions.

Sprints are not allowed for non-Agile/non-Hybrid projects.

## 19. Time Log Flow

1. User creates a time log for a task.
2. User enters log date, hours, and optional description.
3. Backend saves the time log under the current user.
4. Backend recalculates actual hours for the related task.
5. If a time log is updated or deleted, actual task hours are recalculated again.

This keeps task actual effort aligned with submitted time entries.

## 20. Soft Delete Flow

For projects, tasks, users, and files, deletion is handled as soft delete.

1. User clicks delete.
2. Backend marks the record as deleted.
3. Backend stores deletion timestamp.
4. Normal list APIs exclude deleted records.
5. Data remains preserved in the database for audit or recovery purposes.

## 21. End-to-End Demo Scenario

A simple demo can be shown in this order:

1. Login as Admin.
2. Open dashboard and show global project/task statistics.
3. Create a new project and assign a Project Manager and members.
4. Open project details and show members, tasks, files, and activity area.
5. Create a task and assign it to a member.
6. Login as Member and update the assigned task to done.
7. Member requests task approval.
8. Login as Project Manager and approve or reject the task.
9. Upload a project file and show it in the file list.
10. Invite a client to the project.
11. Client accepts invite and views assigned project data only.
12. Request project completion.
13. Login as Admin and approve project completion.

This demonstrates authentication, permissions, project management, task workflow, approval workflow, file handling, client access, and dashboard reporting.

## 22. Key Business Value

- Centralized project and task tracking.
- Clear separation of Admin, Project Manager, Member, and Client responsibilities.
- Permission-controlled access to reduce accidental data exposure.
- Approval workflows for both task completion and project closure.
- Activity history for accountability.
- File versioning support for project/task documents.
- Dashboard visibility for progress monitoring.
- Soft delete design to preserve important business records.

