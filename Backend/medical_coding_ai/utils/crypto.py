from cryptography.fernet import Fernet
import hashlib
import os
import sys
import logging
import base64

logger = logging.getLogger(__name__)

# ============================================================================
# ENCRYPTION KEY VALIDATION (CRITICAL SECURITY)
# ============================================================================
# The encryption key is used to encrypt PII data (email, SSN, phone, names, etc.)
# If this key is lost, encrypted data CANNOT be recovered!
# If this key is compromised, ALL encrypted PII is exposed (HIPAA breach!)
# ============================================================================

ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

# Startup validation - fail fast if encryption key is missing or invalid
if not ENCRYPTION_KEY:
    error_msg = (
        "\n" + "=" * 80 + "\n"
        "❌ CRITICAL ERROR: ENCRYPTION_KEY environment variable is not set!\n"
        "\n"
        "The application cannot start without a valid encryption key.\n"
        "This key is used to encrypt sensitive PII data (email, SSN, phone, etc.)\n"
        "\n"
        "To generate a secure encryption key, run:\n"
        "  python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"\n"
        "\n"
        "Then set the environment variable:\n"
        "  - Linux/Mac: export ENCRYPTION_KEY='your_generated_key'\n"
        "  - Windows: set ENCRYPTION_KEY=your_generated_key\n"
        "  - Or add to .env file: ENCRYPTION_KEY=your_generated_key\n"
        "\n"
        "⚠️  IMPORTANT: Save this key securely! If lost, encrypted data cannot be recovered.\n"
        "=" * 80
    )
    logger.critical(error_msg)
    print(error_msg, file=sys.stderr)
    sys.exit(1)

# Validate key format and length
if len(ENCRYPTION_KEY) < 32:
    error_msg = (
        "\n" + "=" * 80 + "\n"
        f"❌ CRITICAL ERROR: ENCRYPTION_KEY is too short ({len(ENCRYPTION_KEY)} chars)\n"
        "\n"
        "A valid Fernet key must be 44 characters (32 bytes base64-encoded).\n"
        "\n"
        "Generate a new key:\n"
        "  python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"\n"
        "=" * 80
    )
    logger.critical(error_msg)
    print(error_msg, file=sys.stderr)
    sys.exit(1)

# Initialize cipher with validation
try:
    cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
    logger.info("✓ Encryption key validated successfully")
except Exception as e:
    error_msg = (
        "\n" + "=" * 80 + "\n"
        f"❌ CRITICAL ERROR: Invalid ENCRYPTION_KEY format: {e}\n"
        "\n"
        "The ENCRYPTION_KEY must be a valid Fernet key (44 characters).\n"
        "\n"
        "Generate a new key:\n"
        "  python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"\n"
        "=" * 80
    )
    logger.critical(error_msg)
    print(error_msg, file=sys.stderr)
    sys.exit(1)

def encrypt(data: str) -> bytes:
    """Encrypt data and return as bytes (compatible with BYTEA/LargeBinary columns)"""
    if not data:
        return None
    try:
        encrypted_bytes = cipher_suite.encrypt(data.encode())
        return encrypted_bytes  # Return raw bytes for BYTEA column
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        return None

def decrypt(data) -> str:
    """Decrypt base64-encoded string OR raw bytes back to original data"""
    if not data:
        return None
    try:
        # Handle both old format (raw bytes) and new format (base64 string)
        if isinstance(data, bytes):
            # Old format: raw encrypted bytes from database
            encrypted_bytes = data
        else:
            # New format: base64-encoded string
            encrypted_bytes = base64.b64decode(data.encode('utf-8'))

        return cipher_suite.decrypt(encrypted_bytes).decode()
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        return None

def deterministic_hash(data: str) -> str:
    """Create a deterministic hash for searching/indexing"""
    if not data:
        return None
    return hashlib.sha256(data.encode()).hexdigest()
