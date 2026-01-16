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
