import requests
import os

# Test file upload functionality
def test_file_upload():
    # Test with Admin (should succeed)
    print("=== Testing Admin Upload ===")
    test_upload_with_user('admin@saphul.com', 'admin123', should_succeed=True)

    # Test with Member (should fail)
    print("\n=== Testing Member Upload ===")
    test_upload_with_user('sarah@example.com', 'password123', should_succeed=False)

def test_upload_with_user(email, password, should_succeed=True):
    # First login to get token
    login_data = {'email': email, 'password': password}
    login_response = requests.post('http://localhost:8000/auth/login', json=login_data)

    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        print(f'Login successful for {email}')

        headers = {'Authorization': f'Bearer {token}'}

        # Create a test file
        test_file_path = 'test_upload.txt'
        with open(test_file_path, 'w') as f:
            f.write('This is a test file for upload.')

        # Upload file
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_upload.txt', f, 'text/plain')}
            data = {'project_id': 1, 'version': '1.0', 'is_latest': True}
            upload_response = requests.post('http://localhost:8000/files/upload', headers=headers, files=files, data=data)

        print(f'Upload status: {upload_response.status_code}')

        if upload_response.status_code == 201:
            if should_succeed:
                print('✅ Upload successful (expected)')
                upload_data = upload_response.json()
                print(f'File URL: {upload_data["file_url"]}')

                # Check if file exists locally
                file_url = upload_data['file_url']
                if file_url.startswith('/uploads/'):
                    local_path = f'PMS-backend{file_url}'
                    if os.path.exists(local_path):
                        print(f'✅ File exists locally at: {local_path}')
                        with open(local_path, 'r') as f:
                            content = f.read()
                            print(f'File content: {content}')
                    else:
                        print(f'❌ File NOT found locally at: {local_path}')
            else:
                print('❌ Upload succeeded but should have failed (authorization issue)')
        elif upload_response.status_code == 403:
            if not should_succeed:
                print('✅ Upload correctly blocked (expected 403)')
            else:
                print('❌ Upload unexpectedly blocked')
                print(f'Response: {upload_response.text}')
        else:
            print(f'❌ Unexpected status code: {upload_response.status_code}')
            print(f'Response: {upload_response.text}')

        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

    else:
        print(f'❌ Login failed: {login_response.status_code}')
        print(login_response.text)

if __name__ == '__main__':
    test_file_upload()
