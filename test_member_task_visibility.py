import requests
import json

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

def create_test_tasks(admin_token):
    """Create test tasks assigned to different users"""
    headers = {'Authorization': f'Bearer {admin_token}'}

    tasks_data = [
        {
            'title': 'Task for Member 1',
            'description': 'This task is assigned to member 1',
            'project_id': 1,
            'assigned_to': 3  # sarah@example.com
        },
        {
            'title': 'Task for Member 2',
            'description': 'This task is assigned to member 2',
            'project_id': 1,
            'assigned_to': 4  # john@example.com
        },
        {
            'title': 'Unassigned Task',
            'description': 'This task is not assigned to anyone',
            'project_id': 1,
            'assigned_to': None
        }
    ]

    created_tasks = []
    for task_data in tasks_data:
        response = requests.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        if response.status_code == 201:
            task = response.json()
            created_tasks.append(task)
            print(f"✅ Created task: {task['title']} (ID: {task['id']})")
        else:
            print(f"❌ Failed to create task: {response.status_code} - {response.text}")

    return created_tasks

def test_member_sees_only_assigned_tasks(member_token, member_name, expected_task_ids):
    """Test that a member only sees tasks assigned to them"""
    headers = {'Authorization': f'Bearer {member_token}'}

    response = requests.get(f"{BASE_URL}/tasks/", headers=headers)

    if response.status_code == 200:
        tasks = response.json()
        visible_task_ids = [task['id'] for task in tasks]

        print(f"📋 {member_name} sees {len(tasks)} tasks: {visible_task_ids}")

        # Check if member sees only expected tasks
        if set(visible_task_ids) == set(expected_task_ids):
            print(f"✅ {member_name} correctly sees only their assigned tasks")
            return True
        else:
            print(f"❌ {member_name} sees unexpected tasks. Expected: {expected_task_ids}, Got: {visible_task_ids}")
            return False
    else:
        print(f"❌ Failed to get tasks for {member_name}: {response.status_code} - {response.text}")
        return False

def test_admin_sees_all_tasks(admin_token):
    """Test that admin sees all tasks"""
    headers = {'Authorization': f'Bearer {admin_token}'}

    response = requests.get(f"{BASE_URL}/tasks/", headers=headers)

    if response.status_code == 200:
        tasks = response.json()
        print(f"📋 Admin sees {len(tasks)} tasks")

        # Admin should see all tasks (at least the ones we created)
        if len(tasks) >= 3:  # At least the 3 we created
            print("✅ Admin correctly sees all tasks")
            return True
        else:
            print(f"❌ Admin should see all tasks, but only sees {len(tasks)}")
            return False
    else:
        print(f"❌ Failed to get tasks for admin: {response.status_code} - {response.text}")
        return False

def test_project_manager_sees_all_tasks(pm_token):
    """Test that project managers see all tasks from their projects"""
    headers = {'Authorization': f'Bearer {pm_token}'}

    response = requests.get(f"{BASE_URL}/tasks/", headers=headers)

    if response.status_code == 200:
        tasks = response.json()
        print(f"📋 Project Manager sees {len(tasks)} tasks")

        # Project manager should see all tasks from their projects (at least the ones we created)
        if len(tasks) >= 3:  # At least the 3 we created
            print("✅ Project Manager correctly sees all tasks from their projects")
            return True
        else:
            print(f"❌ Project Manager should see all tasks from their projects, but only sees {len(tasks)}")
            return False
    else:
        print(f"❌ Failed to get tasks for Project Manager: {response.status_code} - {response.text}")
        return False

def test_member_task_visibility():
    """Test that members only see tasks assigned to them, but project managers see all"""
    print("🧪 TESTING: Member Task Visibility & Project Manager Access")
    print("=" * 70)

    # Login as admin to create tasks
    admin_token = login_and_get_token('admin@saphul.com', 'admin123')
    if not admin_token:
        print("❌ Cannot proceed without admin login")
        return False

    # Create test tasks
    created_tasks = create_test_tasks(admin_token)
    if len(created_tasks) < 3:
        print("❌ Not enough test tasks created")
        return False

    # Get task IDs for each member
    member1_tasks = [task['id'] for task in created_tasks if task['assigned_to'] == 3]  # sarah@example.com
    member2_tasks = [task['id'] for task in created_tasks if task['assigned_to'] == 4]  # mike@example.com

    # Login as members and project manager
    member1_token = login_and_get_token('sarah@example.com', 'password123')
    member2_token = login_and_get_token('mike@example.com', 'password123')
    pm_token = login_and_get_token('john@example.com', 'password123')

    if not member1_token or not member2_token or not pm_token:
        print("❌ Cannot proceed without all user logins")
        return False

    results = []

    # Test 1: Member 1 sees only their tasks
    print("\n📋 Test 1: Member 1 (Sarah) sees only assigned tasks")
    print("-" * 50)
    success1 = test_member_sees_only_assigned_tasks(member1_token, "Sarah", member1_tasks)
    results.append(("Member 1 sees only assigned tasks", success1))

    # Test 2: Member 2 sees only their tasks
    print("\n📋 Test 2: Member 2 (Mike) sees only assigned tasks")
    print("-" * 50)
    success2 = test_member_sees_only_assigned_tasks(member2_token, "Mike", member2_tasks)
    results.append(("Member 2 sees only assigned tasks", success2))

    # Test 3: Project Manager sees all tasks from their projects
    print("\n📋 Test 3: Project Manager sees all tasks from their projects")
    print("-" * 50)
    success3 = test_project_manager_sees_all_tasks(pm_token)
    results.append(("Project Manager sees all tasks from their projects", success3))

    # Test 4: Admin sees all tasks
    print("\n📋 Test 4: Admin sees all tasks")
    print("-" * 50)
    success4 = test_admin_sees_all_tasks(admin_token)
    results.append(("Admin sees all tasks", success4))

    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 70)

    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_passed = False

    print("\n" + "=" * 70)
    if all_passed:
        print("✅ OVERALL RESULT: PASS")
        print("   Task visibility restrictions are working correctly.")
    else:
        print("❌ OVERALL RESULT: FAIL")
        print("   Task visibility restrictions have issues.")

    print("\n🔧 IMPLEMENTATION SUMMARY:")
    print("-" * 40)
    print("• Regular members can ONLY see tasks assigned to them")
    print("• Project managers can see ALL tasks from projects they manage")
    print("• Members cannot see tasks assigned to other members")
    print("• Members cannot see unassigned tasks")
    print("• Admins can see all tasks across all projects")
    print("• Clear task filtering prevents unauthorized access")

    return all_passed

if __name__ == "__main__":
    test_member_task_visibility()
