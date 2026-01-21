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

def create_test_task(token):
    """Create a test task and return its ID"""
    headers = {'Authorization': f'Bearer {token}'}

    task_data = {
        'title': 'Test Task for Member Restrictions',
        'description': 'Testing member field editing restrictions',
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

def assign_task_to_member(admin_token, task_id, member_id):
    """Assign task to a member"""
    headers = {'Authorization': f'Bearer {admin_token}'}

    assign_data = {'assigned_to': member_id}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=assign_data, headers=headers)

    if response.status_code == 200:
        print(f"✅ Task {task_id} assigned to member {member_id}")
        return True
    else:
        print(f"❌ Failed to assign task: {response.status_code} - {response.text}")
        return False

def test_member_cannot_edit_title(token, task_id):
    """Test that member cannot edit task title"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'title': 'New Title by Member'}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if response.status_code == 403:
        print("✅ Correctly prevented member from editing title (403 Forbidden)")
        return True
    else:
        print(f"❌ Unexpected response when member tried to edit title: {response.status_code} - {response.text}")
        return False

def test_member_cannot_edit_description(token, task_id):
    """Test that member cannot edit task description"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'description': 'New description by member'}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if response.status_code == 403:
        print("✅ Correctly prevented member from editing description (403 Forbidden)")
        return True
    else:
        print(f"❌ Unexpected response when member tried to edit description: {response.status_code} - {response.text}")
        return False

def test_member_can_edit_status(token, task_id):
    """Test that member can still edit status"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'status': 'IN_PROGRESS'}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if response.status_code == 200:
        print("✅ Member can still edit status (allowed)")
        return True
    else:
        print(f"❌ Member cannot edit status: {response.status_code} - {response.text}")
        return False

def test_admin_can_edit_title(token, task_id):
    """Test that admin can edit task title"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'title': 'New Title by Admin'}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if response.status_code == 200:
        print("✅ Admin can edit title (allowed)")
        return True
    else:
        print(f"❌ Admin cannot edit title: {response.status_code} - {response.text}")
        return False

def test_admin_can_edit_description(token, task_id):
    """Test that admin can edit task description"""
    headers = {'Authorization': f'Bearer {token}'}

    update_data = {'description': 'New description by admin'}

    response = requests.put(f"{BASE_URL}/tasks/{task_id}", json=update_data, headers=headers)

    if response.status_code == 200:
        print("✅ Admin can edit description (allowed)")
        return True
    else:
        print(f"❌ Admin cannot edit description: {response.status_code} - {response.text}")
        return False

def test_member_field_restrictions():
    """Test that members cannot edit title/description but can edit status"""
    print("🧪 TESTING: Member Field Editing Restrictions")
    print("=" * 60)

    # Login as admin to create and manage tasks
    admin_token = login_and_get_token('admin@saphul.com', 'admin123')
    if not admin_token:
        print("❌ Cannot proceed without admin login")
        return False

    # Login as member
    member_token = login_and_get_token('sarah@example.com', 'password123')
    if not member_token:
        print("❌ Cannot proceed without member login")
        return False

    # Create a test task
    task_id = create_test_task(admin_token)
    if not task_id:
        print("❌ Cannot proceed without test task")
        return False

    # Assign task to member (assuming sarah@example.com has ID 3)
    if not assign_task_to_member(admin_token, task_id, 3):
        print("❌ Cannot proceed without task assignment")
        return False

    results = []

    # Test 1: Member cannot edit title
    print("\n📋 Test 1: Member cannot edit title")
    print("-" * 40)
    success1 = test_member_cannot_edit_title(member_token, task_id)
    results.append(("Member cannot edit title", success1))

    # Test 2: Member cannot edit description
    print("\n📋 Test 2: Member cannot edit description")
    print("-" * 40)
    success2 = test_member_cannot_edit_description(member_token, task_id)
    results.append(("Member cannot edit description", success2))

    # Test 3: Member can still edit status
    print("\n📋 Test 3: Member can edit status")
    print("-" * 40)
    success3 = test_member_can_edit_status(member_token, task_id)
    results.append(("Member can edit status", success3))

    # Test 4: Admin can edit title
    print("\n📋 Test 4: Admin can edit title")
    print("-" * 40)
    success4 = test_admin_can_edit_title(admin_token, task_id)
    results.append(("Admin can edit title", success4))

    # Test 5: Admin can edit description
    print("\n📋 Test 5: Admin can edit description")
    print("-" * 40)
    success5 = test_admin_can_edit_description(admin_token, task_id)
    results.append(("Admin can edit description", success5))

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
        print("   Member field editing restrictions are working correctly.")
    else:
        print("❌ OVERALL RESULT: FAIL")
        print("   Member field editing restrictions have issues.")

    print("\n🔧 IMPLEMENTATION SUMMARY:")
    print("-" * 40)
    print("• Members can NEVER edit title or description fields")
    print("• Members can only edit status (TODO, IN_PROGRESS, BLOCKED, DONE)")
    print("• Admins and project managers can edit all fields")
    print("• Clear error messages prevent unauthorized field edits")

    return all_passed

if __name__ == "__main__":
    test_member_field_restrictions()
