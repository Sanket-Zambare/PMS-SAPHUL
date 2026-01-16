import requests
import json

# Login as PM user
login_data = {'email': 'john@example.com', 'password': 'password123'}
response = requests.post('http://localhost:8000/auth/login', json=login_data)
if response.status_code == 200:
    token = response.json()['access_token']
    print('Login successful')

    # Check project memberships
    headers = {'Authorization': f'Bearer {token}'}
    memberships_response = requests.get('http://localhost:8000/project-members/user/2', headers=headers)
    print(f'Memberships status: {memberships_response.status_code}')
    if memberships_response.status_code == 200:
        memberships = memberships_response.json()
        print(f'Memberships: {memberships}')

        # Get project IDs
        project_ids = [m['project_id'] for m in memberships]
        print(f'Project IDs: {project_ids}')

        # Test tasks API with project_ids
        if project_ids:
            project_ids_str = ','.join(map(str, project_ids))
            tasks_response = requests.get(f'http://localhost:8000/tasks?project_ids={project_ids_str}', headers=headers)
            print(f'Tasks API status: {tasks_response.status_code}')
            if tasks_response.status_code != 200:
                print(f'Error: {tasks_response.text}')
            else:
                tasks = tasks_response.json()
                print(f'Found {len(tasks)} tasks')
                for task in tasks:
                    print(f'  - {task["title"]} (Project: {task["project_id"]})')
        else:
            print('No project memberships found')
    else:
        print(f'Memberships error: {memberships_response.text}')
else:
    print(f'Login failed: {response.status_code}')
    print(response.text)
