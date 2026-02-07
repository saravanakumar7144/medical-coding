#!/usr/bin/env python3
"""
Direct API test to check if the backend is working properly
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_create_session():
    """Test session creation"""
    try:
        response = requests.post(f"{BASE_URL}/api/sessions")
        print(f"Create session: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"Create session failed: {e}")
        return None

def test_system_status():
    """Test system status"""
    try:
        response = requests.get(f"{BASE_URL}/api/system/status")
        print(f"System status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"System status failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Medical Coding AI API...")
    print("-" * 50)
    
    # Test health
    if test_health():
        print("✓ Health check passed")
    else:
        print("✗ Health check failed")
    
    print("-" * 50)
    
    # Test system status
    if test_system_status():
        print("✓ System status check passed")
    else:
        print("✗ System status check failed")
    
    print("-" * 50)
    
    # Test session creation
    session = test_create_session()
    if session:
        print("✓ Session creation passed")
        print(f"Session ID: {session.get('session_id', 'N/A')}")
    else:
        print("✗ Session creation failed")
    
    print("-" * 50)
    print("API test complete!")
