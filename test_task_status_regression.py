import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def login_and_get_token(email, password):
    """Login and return access token"""
    login_data = {'email': email, 'password': password}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"❌ Login failed for {email}: {response.status_code}")
        return None

def create_test_task(token):
    """Create a test task and return its ID"""
    headers = {'Authorization': f'Bearer {token}'}

    task_data = {
        'title': 'Test Task for Status Regression',
        'description': 'Testing task status regression prevention',
        'project_id': 1,  # Assuming project 1 exists
        'assigned_to': None  # Will assign later
    }

    response = requests.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)

    if response.status_code == 201:
        task_id = response.json()['id']
        print(f"✅ Created test task with ID: {task_id}")
        return task_id
    else:
        print(f"❌ Failed to create task: {response.status_code} - {response.text}")
        return None

def update_task_status(token, task_id, status, expected_success=True):
    """Update task status and return success/failure"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'status': status}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if expected_success:
        if response.status_code == 200:
            print(f"✅ Successfully updated task {task_id} to {status}")
            return True
        else:
            print(f"❌ Failed to update task {task_id} to {status}: {response.status_code} - {response.text}")
            return False
    else:
        if response.status_code == 400:
            print(f"✅ Correctly prevented regression to {status} (400 error as expected)")
            return True
        else:
            print(f"❌ Unexpected response when trying to regress to {status}: {response.status_code} - {response.text}")
            return False

def request_task_approval(token, task_id):
    """Request approval for a task"""
    headers = {'Authorization': f'Bearer {token}'}

    response = requests.post(f"{BASE_URL}/tasks/{task_id}/request-approval", headers=headers)

    if response.status_code == 200:
        print(f"✅ Successfully requested approval for task {task_id}")
        return True
    else:
        print(f"❌ Failed to request approval: {response.status_code} - {response.text}")
        return False

def approve_task(token, task_id):
    """Approve a task"""
    headers = {'Authorization': f'Bearer {token}'}

    response = requests.post(f"{BASE_URL}/tasks/{task_id}/approve", headers=headers)

    if response.status_code == 200:
        print(f"✅ Successfully approved task {task_id}")
        return True
    else:
        print(f"❌ Failed to approve task: {response.status_code} - {response.text}")
        return False

def test_task_status_regression():
    """Test that tasks cannot be regressed to earlier statuses once completed/reviewed"""
    print("🧪 TESTING: Task Status Regression Prevention")
    print("=" * 60)

    # Login as admin to create and manage tasks
    admin_token = login_and_get_token('admin@saphul.com', 'admin123')
    if not admin_token:
        print("❌ Cannot proceed without admin login")
        return False

    # Create a test task
    task_id = create_test_task(admin_token)
    if not task_id:
        print("❌ Cannot proceed without test task")
        return False

    results = []

    # Test 1: Normal progression should work
    print("\n📋 Test 1: Normal Status Progression")
    print("-" * 40)

    # TODO -> IN_PROGRESS (should work)
    success1 = update_task_status(admin_token, task_id, 'IN_PROGRESS', expected_success=True)
    results.append(("TODO → IN_PROGRESS", success1))

    # IN_PROGRESS -> DONE (should work)
    success2 = update_task_status(admin_token, task_id, 'DONE', expected_success=True)
    results.append(("IN_PROGRESS → DONE", success2))

    # Test 2: Regression prevention once DONE
    print("\n📋 Test 2: Regression Prevention (DONE status)")
    print("-" * 40)

    # DONE -> IN_PROGRESS (should fail)
    success3 = update_task_status(admin_token, task_id, 'IN_PROGRESS', expected_success=False)
    results.append(("DONE → IN_PROGRESS (blocked)", success3))

    # DONE -> TODO (should fail)
    success4 = update_task_status(admin_token, task_id, 'TODO', expected_success=False)
    results.append(("DONE → TODO (blocked)", success4))

    # Test 3: Regression prevention during review process
    print("\n📋 Test 3: Regression Prevention (Under Review)")
    print("-" * 40)

    # First, assign the task to a member so they can request approval
    member_token = login_and_get_token('sarah@example.com', 'password123')
    if member_token:
        # Assign task to member
        assign_data = {'assigned_to': 3}  # Assuming sarah@example.com has ID 3
        headers = {'Authorization': f'Bearer {admin_token}'}
        assign_response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=assign_data, headers=headers)

        if assign_response.status_code == 200:
            print("✅ Task assigned to member")

            # Member requests approval
            approval_requested = request_task_approval(member_token, task_id)
            results.append(("Request approval", approval_requested))

            if approval_requested:
                # Now try to regress status while under review
                success5 = update_task_status(admin_token, task_id, 'IN_PROGRESS', expected_success=False)
                results.append(("UNDER_REVIEW → IN_PROGRESS (blocked)", success5))

                success6 = update_task_status(admin_token, task_id, 'TODO', expected_success=False)
                results.append(("UNDER_REVIEW → TODO (blocked)", success6))

                # Approve the task
                approved = approve_task(admin_token, task_id)
                results.append(("Approve task", approved))

                if approved:
                    # Test regression after approval
                    success7 = update_task_status(admin_token, task_id, 'IN_PROGRESS', expected_success=False)
                    results.append(("APPROVED → IN_PROGRESS (blocked)", success7))

                    success8 = update_task_status(admin_token, task_id, 'TODO', expected_success=False)
                    results.append(("APPROVED → TODO (blocked)", success8))
                else:
                    results.append(("Approve task", False))
                    results.append(("APPROVED → IN_PROGRESS (blocked)", False))
                    results.append(("APPROVED → TODO (blocked)", False))
            else:
                results.append(("UNDER_REVIEW → IN_PROGRESS (blocked)", False))
                results.append(("UNDER_REVIEW → TODO (blocked)", False))
                results.append(("Approve task", False))
                results.append(("APPROVED → IN_PROGRESS (blocked)", False))
                results.append(("APPROVED → TODO (blocked)", False))
        else:
            print("❌ Failed to assign task to member")
            results.extend([("Request approval", False), ("UNDER_REVIEW → IN_PROGRESS (blocked)", False),
                          ("UNDER_REVIEW → TODO (blocked)", False), ("Approve task", False),
                          ("APPROVED → IN_PROGRESS (blocked)", False), ("APPROVED → TODO (blocked)", False)])
    else:
        print("❌ Cannot login as member")
        results.extend([("Request approval", False), ("UNDER_REVIEW → IN_PROGRESS (blocked)", False),
                      ("UNDER_REVIEW → TODO (blocked)", False), ("Approve task", False),
                      ("APPROVED → IN_PROGRESS (blocked)", False), ("APPROVED → TODO (blocked)", False)])

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)

    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("✅ OVERALL RESULT: PASS")
        print("   Task status regression prevention is working correctly.")
    else:
        print("❌ OVERALL RESULT: FAIL")
        print("   Task status regression prevention has issues.")

    print("\n🔧 IMPLEMENTATION SUMMARY:")
    print("-" * 40)
    print("• Tasks cannot be changed back to TODO or IN_PROGRESS once DONE")
    print("• Tasks cannot be regressed while UNDER_REVIEW or APPROVED")
    print("• Normal forward progression (TODO → IN_PROGRESS → DONE) still works")
    print("• Review and approval workflow is preserved")

    return all_passed

if __name__ == "__main__":
    test_task_status_regression()
