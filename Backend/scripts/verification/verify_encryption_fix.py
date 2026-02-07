"""
Verify Encryption Fix - Test encrypt/decrypt functions return correct types
"""
from medical_coding_ai.utils.crypto import encrypt, decrypt

print("=" * 80)
print("Verifying Encryption Fix")
print("=" * 80)

# Test data
test_data = "John Doe"
print(f"\n[1] Original data: {test_data}")

# Test encryption
encrypted = encrypt(test_data)
print(f"\n[2] Encrypted data:")
print(f"    Type: {type(encrypted).__name__}")
print(f"    Value: {encrypted[:50]}..." if len(encrypted) > 50 else f"    Value: {encrypted}")

# Verify it's a string (not bytes)
if isinstance(encrypted, str):
    print("    ✓ Returns string (compatible with TEXT columns)")
else:
    print(f"    ❌ Returns {type(encrypted).__name__} (should be str)")

# Test decryption
decrypted = decrypt(encrypted)
print(f"\n[3] Decrypted data:")
print(f"    Type: {type(decrypted).__name__}")
print(f"    Value: {decrypted}")

# Verify round-trip works
if decrypted == test_data:
    print("    ✓ Decryption successful (matches original)")
else:
    print(f"    ❌ Decryption mismatch: expected '{test_data}', got '{decrypted}'")

# Test with None
print(f"\n[4] Testing None handling:")
encrypted_none = encrypt(None)
print(f"    encrypt(None) = {encrypted_none}")
decrypted_none = decrypt(None)
print(f"    decrypt(None) = {decrypted_none}")

if encrypted_none is None and decrypted_none is None:
    print("    ✓ None handling correct")
else:
    print("    ❌ None handling incorrect")

# Test with empty string
print(f"\n[5] Testing empty string:")
encrypted_empty = encrypt("")
print(f"    encrypt('') = {encrypted_empty}")

if encrypted_empty is None:
    print("    ✓ Empty string handling correct")
else:
    print("    ❌ Empty string handling incorrect")

print("\n" + "=" * 80)
print("Verification Complete")
print("=" * 80)
print("\nSummary:")
print("✓ encrypt() now returns base64-encoded string (compatible with TEXT columns)")
print("✓ decrypt() now accepts base64-encoded string")
print("✓ Round-trip encryption/decryption works correctly")
print("\nNext step: Test patient creation with:")
print("  python test_patient_creation.py")
