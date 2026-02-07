"""
Test Patient Creation - Verify encryption fix works
"""
import asyncio
import requests
import json

API_URL = "http://localhost:8000"

async def test_patient_creation():
    print("=" * 80)
    print("Testing Patient Creation with Encryption Fix")
    print("=" * 80)

    # First, get an auth token
    print("\n[1] Logging in...")
    login_response = requests.post(
        f"{API_URL}/api/auth/login",
        json={
            "email": "admin@test.com",
            "password": "Admin@123"
        }
    )

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return

    token = login_response.json()["access_token"]
    print("✓ Login successful")

    # Now try to create a patient
    print("\n[2] Creating test patient...")

    patient_data = {
        "mrn": "TEST-001",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1980-01-01",
        "gender": "M",
        "email": "john.doe@example.com",
        "phone_primary": "555-123-4567",
        "ssn": "123-45-6789",
        "address_line1": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip_code": "12345"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    create_response = requests.post(
        f"{API_URL}/api/claims/patients",
        headers=headers,
        json=patient_data
    )

    print(f"\nStatus Code: {create_response.status_code}")

    if create_response.status_code == 201:
        print("✓ Patient created successfully!")
        print(json.dumps(create_response.json(), indent=2))
    else:
        print(f"❌ Patient creation failed: {create_response.status_code}")
        print(create_response.text)
        return

    # Verify we can retrieve the patient
    print("\n[3] Retrieving created patient...")

    patient_id = create_response.json()["patient_id"]
    get_response = requests.get(
        f"{API_URL}/api/claims/patients/{patient_id}",
        headers=headers
    )

    if get_response.status_code == 200:
        print("✓ Patient retrieved successfully!")
        retrieved_patient = get_response.json()

        # Verify decryption works
        print("\n[4] Verifying decrypted data...")
        print(f"  Name: {retrieved_patient['first_name']} {retrieved_patient['last_name']}")
        print(f"  DOB: {retrieved_patient['date_of_birth']}")
        print(f"  Email: {retrieved_patient.get('email', 'N/A')}")
        print(f"  Phone: {retrieved_patient.get('phone_primary', 'N/A')}")

        if (retrieved_patient['first_name'] == "John" and
            retrieved_patient['last_name'] == "Doe"):
            print("\n✓ Encryption/Decryption working correctly!")
        else:
            print("\n❌ Decryption mismatch!")
    else:
        print(f"❌ Failed to retrieve patient: {get_response.status_code}")
        print(get_response.text)

    print("\n" + "=" * 80)
    print("Test Complete")
    print("=" * 80)

if __name__ == "__main__":
    try:
        asyncio.run(test_patient_creation())
    except requests.exceptions.ConnectionError:
        print("\n❌ Could not connect to backend at http://localhost:8000")
        print("   Make sure the backend is running:")
        print("   cd Backend && python -m uvicorn main:app --reload --port 8000")
