"""
Test Phase 8 API Endpoints
Quick smoke test to verify all Phase 8 endpoints are accessible
"""

import requests
import json
from datetime import date

# Configuration
BASE_URL = "http://localhost:8000"
# You'll need to update this with a valid token from your login
TOKEN = None  # Will be set after login

def print_result(endpoint, status_code, response_text):
    """Print test results"""
    status = "✓ PASS" if status_code in [200, 201] else "✗ FAIL"
    print(f"{status} | {endpoint:<40} | Status: {status_code}")
    if status_code not in [200, 201, 401]:
        print(f"     Response: {response_text[:200]}")

def login():
    """Login and get token"""
    global TOKEN
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": "admin",  # Update with your credentials
            "password": "admin123"  # Update with your credentials
        }
    )
    if response.status_code == 200:
        TOKEN = response.json().get("access_token")
        print(f"✓ Login successful, token obtained")
        return True
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

def test_endpoints():
    """Test all Phase 8 endpoints"""
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}

    print("\n" + "=" * 80)
    print("Testing Phase 8 API Endpoints")
    print("=" * 80 + "\n")

    # Test patients endpoint
    print("PATIENTS API:")
    response = requests.get(f"{BASE_URL}/api/claims/patients?limit=10", headers=headers)
    print_result("GET /api/claims/patients", response.status_code, response.text)

    # Test encounters endpoint
    print("\nENCOUNTERS API:")
    response = requests.get(f"{BASE_URL}/api/claims/encounters?limit=10", headers=headers)
    print_result("GET /api/claims/encounters", response.status_code, response.text)

    # Test claims endpoint
    print("\nCLAIMS API:")
    response = requests.get(f"{BASE_URL}/api/claims/claims?limit=10", headers=headers)
    print_result("GET /api/claims/claims", response.status_code, response.text)

    # Test denials endpoint
    print("\nDENIALS API:")
    response = requests.get(f"{BASE_URL}/api/claims/denials?limit=10", headers=headers)
    print_result("GET /api/claims/denials", response.status_code, response.text)

    # Test payers endpoint
    print("\nPAYERS API:")
    response = requests.get(f"{BASE_URL}/api/claims/payers?limit=10", headers=headers)
    print_result("GET /api/claims/payers", response.status_code, response.text)

    # Test revenue metrics endpoint
    print("\nREVENUE METRICS API:")
    response = requests.get(f"{BASE_URL}/api/claims/revenue-metrics", headers=headers)
    print_result("GET /api/claims/revenue-metrics", response.status_code, response.text)

    print("\n" + "=" * 80)
    print("Testing Complete")
    print("=" * 80)

if __name__ == '__main__':
    print("Phase 8 API Smoke Test")
    print("=" * 80)

    # Try to login first
    if login():
        test_endpoints()
    else:
        print("\n⚠ Skipping API tests - login failed")
        print("   Note: Update credentials in the script or test without auth")
        print("\nTesting endpoints without authentication:")
        TOKEN = None
        test_endpoints()
