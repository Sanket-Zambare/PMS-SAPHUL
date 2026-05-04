import requests
import json

BASE_URL = 'http://localhost:8000'

def test_client_project_access():
    """Test client access to project details"""
    print("🧪 Testing Client Project Access")
    print("=" * 50)

    # Login as client
    login_data = {'email': 'client@example.com', 'password': 'password123'}
    response = requests.post(f'{BASE_URL}/auth/login', json=login_data)

    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return False

    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    print("✅ Client logged in successfully")

    # Try to get projects
    projects_response = requests.get(f'{BASE_URL}/projects/', headers=headers)
    print(f"📋 Projects list response: {projects_response.status_code}")

    if projects_response.status_code != 200:
        print(f"❌ Failed to get projects: {projects_response.text}")
        return False

    projects = projects_response.json()
    print(f"📋 Client sees {len(projects)} projects")

    if not projects:
        print("❌ Client sees no projects - this is the issue!")
        return False

    # Try to get project details
    project_id = projects[0]['id']
    print(f"🔍 Trying to get project {project_id} details...")

    detail_response = requests.get(f'{BASE_URL}/projects/{project_id}', headers=headers)
    print(f"📄 Project detail response: {detail_response.status_code}")

    if detail_response.status_code != 200:
        print(f"❌ Failed to get project details: {detail_response.text}")
        return False

    project_data = detail_response.json()
    print(f"✅ Successfully retrieved project: {project_data.get('name', 'Unknown')}")
    return True

if __name__ == "__main__":
    test_client_project_access()
