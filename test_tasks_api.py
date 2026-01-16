import requests
import json

# Login as PM user
login_data = {'email': 'john@example.com', 'password': 'password123'}
response = requests.post('http://localhost:8000/auth/login', json=login_data)
if response.status_code == 200:
    token = response.json()['access_token']
    print('Login successful')

    # Test tasks API with project_ids
    headers = {'Authorization': f'Bearer {token}'}
    tasks_response = requests.get('http://localhost:8000/tasks?project_ids=1,2', headers=headers)
    print(f'Tasks API status: {tasks_response.status_code}')
    if tasks_response.status_code != 200:
        print(f'Error: {tasks_response.text}')
    else:
        tasks = tasks_response.json()
        print(f'Found {len(tasks)} tasks')
        for task in tasks:
            print(f'  - {task["title"]} (Project: {task["project_id"]})')
else:
    print(f'Login failed: {response.status_code}')
    print(response.text)
