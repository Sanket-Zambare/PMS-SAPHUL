import requests
import json

BASE_URL = "http://localhost:8000"

def test_login(email, password, test_name):
    """Test login with given credentials"""
    print(f"\n--- Testing {test_name} ---")
    login_data = {'email': email, 'password': password}

    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ PASS: Login successful")
            print(f"Token received: {data.get('access_token', 'N/A')[:50]}...")
            return True
        elif response.status_code == 401:
            error_detail = response.json().get('detail', 'Unknown error')
            print(f"❌ FAIL: Login failed - {error_detail}")
            return False
        else:
            print(f"❌ FAIL: Unexpected status code - {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Request failed - {e}")
        return False

def test_forgot_password(email, test_name):
    """Test forgot password with given email"""
    print(f"\n--- Testing {test_name} ---")
    forgot_data = {'email': email}

    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password", json=forgot_data, timeout=10)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            message = data.get('message', '')
            print("✅ PASS: Forgot password request processed")
            print(f"Response: {message}")
            return True
        else:
            print(f"❌ FAIL: Unexpected status code - {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR: Request failed - {e}")
        return False

def main():
    print("🔍 BLACK-BOX TESTING: Authentication System - Case-Insensitive Email Handling")
    print("=" * 80)

    # Test user credentials from QUICK_START.md
    test_email = "john@example.com"
    test_password = "password123"

    # Login Tests
    login_tests = [
        (test_email, test_password, "Login with john@example.com (lowercase)"),
        ("JOHN@example.com", test_password, "Login with JOHN@example.com (uppercase)"),
        ("John@Example.com", test_password, "Login with John@Example.com (mixed case)"),
    ]

    login_results = []
    for email, password, test_name in login_tests:
        result = test_login(email, password, test_name)
        login_results.append((test_name, result))

    # Forgot Password Tests
    forgot_tests = [
        (test_email, "Forgot password with john@example.com (lowercase)"),
        ("JOHN@example.com", "Forgot password with JOHN@example.com (uppercase)"),
        ("John@Example.com", "Forgot password with John@Example.com (mixed case)"),
    ]

    forgot_results = []
    for email, test_name in forgot_tests:
        result = test_forgot_password(email, test_name)
        forgot_results.append((test_name, result))

    # Summary Report
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)

    print("\n🔐 LOGIN TESTS:")
    all_login_pass = True
    for test_name, result in login_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_login_pass = False

    print("\n🔑 FORGOT PASSWORD TESTS:")
    all_forgot_pass = True
    for test_name, result in forgot_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if not result:
            all_forgot_pass = False

    print("\n" + "=" * 80)
    print("🎯 BUSINESS RULE: Email addresses must be treated as case-insensitive")
    print("=" * 80)

    if all_login_pass and all_forgot_pass:
        print("✅ OVERALL RESULT: PASS")
        print("   All authentication flows correctly handle case-insensitive emails.")
    else:
        print("❌ OVERALL RESULT: FAIL")
        print("   Case-sensitive behavior detected in authentication system.")

        # Defect Report
        print("\n🐛 DEFECT REPORT:")
        print("-" * 40)
        print("Issue: Authentication system treats emails as case-sensitive")
        print("Impact: Users cannot login or reset passwords with different email casing")
        print("Severity: High (affects user accessibility)")
        print("Expected: All email variations should be recognized as the same user")
        print("Actual: Some email variations fail authentication")

        # Backend Recommendation
        print("\n🔧 BACKEND RECOMMENDATION:")
        print("-" * 40)
        print("Modify database queries in auth.py to use case-insensitive email matching:")
        print("  - Change: User.email == user_credentials.email")
        print("  - To: User.email.ilike(user_credentials.email)")
        print("  - Or: func.lower(User.email) == func.lower(user_credentials.email)")
        print("Apply this change to both login and forgot-password endpoints.")

if __name__ == "__main__":
    main()
