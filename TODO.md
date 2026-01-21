# Fix Project Manager Task Visibility Issue

## Problem
Project managers (including newly created ones) cannot see the task list because the `get_tasks` function uses `is_project_manager()` which checks for the global PROJECT_MANAGER role, but project managers are assigned per-project in the `project_members` table.

## Solution
Update the `is_project_manager` function in `tasks.py` to check for project manager assignments in the `project_members` table instead of the global role.

## Tasks
- [ ] Update `is_project_manager` function in `PMS-backend/app/routes/tasks.py`
- [ ] Test the fix to ensure project managers can see tasks from their projects
