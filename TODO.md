# TODO: Fix Admin Project Visibility Issue

## Current Issue
Admin users cannot see all projects - they only see projects they are assigned to.

## Plan
- Modify the `get_projects` endpoint in `PMS-backend/app/routes/projects.py` to:
  - Check if user has `PROJECT_VIEW_ALL` permission (admin)
  - If yes, return all projects
  - If no, return only assigned projects
  - Update permission requirement to allow either `PROJECT_VIEW_ALL` or `PROJECT_VIEW_ASSIGNED`

## Steps
- [ ] Update get_projects endpoint logic
- [ ] Test admin can see all projects
- [ ] Test non-admin users still only see assigned projects
