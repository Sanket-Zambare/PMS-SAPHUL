# TODO: Implement Task Review Functionality

## Tasks Page Updates
- [x] Add Review Status and Approval Status columns to the tasks table
- [x] Add "Request Approval" button for assigned members when task status is DONE
- [x] Add "Approve" and "Reject" buttons for users with TASK_APPROVE permission when approval_status is PENDING
- [x] Implement API calls for requestApproval, approve, and reject actions
- [x] Update table row rendering to include new status badges

## Task Details Page Updates
- [x] Display review_status and approval_status in task details
- [x] Add review action buttons in Quick Actions section
- [x] Show review requested date, reviewed date, and reviewed by information
- [x] Implement API calls for review actions in details view

## Testing
- [ ] Test member requesting approval for DONE tasks
- [ ] Test PM approving/rejecting pending approvals
- [ ] Verify status updates and notifications

## Bug Fixes
- [x] Fixed missing helper functions in TaskDetails.jsx (getReviewStatusVariant, getReviewStatusLabel, getApprovalStatusVariant, getApprovalStatusLabel, getUserName)

## Task: Restrict project and task visibility for CLIENT users

### Completed Steps
- [x] Added is_client(db, user_id) function in projects.py to check if user has CLIENT role
- [x] Modified get_projects in projects.py to restrict CLIENT users to assigned projects only
- [x] Added is_client(db, user_id) function in tasks.py to check if user has CLIENT role
- [x] Modified get_tasks in tasks.py to restrict CLIENT users to tasks from assigned projects only
- [x] Updated TODO.md with completion summary

### Summary of Changes
- CLIENT users now ALWAYS see only projects and tasks where they exist in PROJECT_MEMBERS
- Non-CLIENT roles (ADMIN, PROJECT_MANAGER, MEMBER) maintain existing behavior
- No database schema changes
- No new endpoints or response shape changes
- Minimal query changes at the database level
