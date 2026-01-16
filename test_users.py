import requests

# Test login for member
login_data = {'email': 'sarah@example.com', 'password': 'password123'}
response = requests.post('http://localhost:8000/auth/login', json=login_data)
if response.status_code == 200:
    token = response.json()['access_token']
    print('Login successful for Member')

    # Test users endpoint
    headers = {'Authorization': f'Bearer {token}'}
    users_response = requests.get('http://localhost:8000/users', headers=headers)
    if users_response.status_code == 200:
        users = users_response.json()
        print(f'Member can see {len(users)} users:')
        for u in users:
            print(f'  - {u["name"]} ({u["email"]})')
    else:
        print(f'Users API error: {users_response.status_code}')
        print(users_response.text)
else:
    print(f'Login failed: {response.status_code}')
