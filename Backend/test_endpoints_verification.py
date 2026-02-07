#!/usr/bin/env python3
"""
Verification script to test key Medical Coding AI endpoints
Run this after both backend and frontend are started
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_endpoint(method, endpoint, description, data=None, headers=None):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n▶ {description}")
    print(f"  {method} {url}")
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=5)
        else:
            print("  ❌ Unknown method")
            return False
        
        print(f"  Status: {response.status_code}")
        
        if response.status_code < 300:
            print("  ✅ SUCCESS")
            try:
                print(f"  Response: {json.dumps(response.json(), indent=2)[:200]}...")
            except:
                print(f"  Response: {response.text[:200]}...")
            return True
        else:
            print("  ❌ FAILED")
            try:
                print(f"  Error: {json.dumps(response.json(), indent=2)}")
            except:
                print(f"  Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("  ❌ FAILED - Connection refused (is backend running?)")
        return False
    except Exception as e:
        print(f"  ❌ FAILED - {str(e)}")
        return False

def main():
    print_header("Medical Coding AI - End-to-End Verification")
    print(f"Backend URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = {}
    
    # Test 1: Health Check
    print_header("1. Health Check")
    results["health"] = test_endpoint("GET", "/health", "Check API health")
    
    # Test 2: Login
    print_header("2. Authentication")
    login_data = {
        "username": "admin@example.com",
        "password": "admin"
    }
    results["login"] = test_endpoint("POST", "/api/auth/login", "Login with admin credentials", data=login_data)
    
    # Test 3: Get Current User
    print_header("3. User Profile")
    # For this we'd need a token, so we'll just test the endpoint availability
    test_endpoint("GET", "/api/auth/me", "Get current user profile (requires auth token)")
    
    # Test 4: List Tenants
    print_header("4. Tenant Management")
    results["tenants"] = test_endpoint("GET", "/api/tenants", "List all tenants")
    
    # Test 5: Check EHR Status
    print_header("5. EHR Integration")
    results["ehr"] = test_endpoint("GET", "/api/ehr/connections", "Check EHR connections")
    
    # Test 6: Test Admin Endpoints
    print_header("6. Admin Operations")
    results["admin"] = test_endpoint("GET", "/api/admin/status", "Check admin status")
    
    # Summary
    print_header("Verification Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"\nTests Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check backend connectivity")
        return 1

if __name__ == "__main__":
    sys.exit(main())
