#!/usr/bin/env python3
"""
Helper script to generate secure secrets for Panaceon V-06
Run this script to generate all required secret keys for your .env file
"""

import secrets
from cryptography.fernet import Fernet

print("=" * 80)
print("PANACEON V-06 - SECURE SECRETS GENERATOR")
print("=" * 80)
print()
print("⚠️  IMPORTANT: Copy these values to your .env file")
print("⚠️  Store them securely and NEVER commit them to version control!")
print()
print("=" * 80)
print()

# Generate Encryption Key (Fernet)
encryption_key = Fernet.generate_key().decode()
print("# Encryption Key for PII Data")
print(f"ENCRYPTION_KEY={encryption_key}")
print()

# Generate JWT Secret
jwt_secret = secrets.token_urlsafe(32)
print("# JWT Secret for Authentication Tokens")
print(f"JWT_SECRET_KEY={jwt_secret}")
print()

# Generate Platform Admin Key
admin_key = secrets.token_urlsafe(32)
print("# Platform Admin Key")
print(f"PLATFORM_ADMIN_KEY={admin_key}")
print()

print("=" * 80)
print()
print("Next steps:")
print("1. Copy these values to Backend/.env")
print("2. Set DATABASE_URL with your actual database credentials")
print("3. Set SMTP configuration for email sending")
print("4. Set CORS_ALLOWED_ORIGINS with your frontend URL")
print()
print("Example .env file:")
print("-" * 80)
print(f"DATABASE_URL=postgresql+asyncpg://admin:your_password@localhost:5432/multitenant_db")
print(f"ENCRYPTION_KEY={encryption_key}")
print(f"JWT_SECRET_KEY={jwt_secret}")
print(f"PLATFORM_ADMIN_KEY={admin_key}")
print(f"CORS_ALLOWED_ORIGINS=http://localhost:3000")
print(f"FRONTEND_URL=http://localhost:3000")
print(f"SMTP_HOST=smtp.gmail.com")
print(f"SMTP_PORT=587")
print(f"SMTP_USER=your-email@gmail.com")
print(f"SMTP_PASSWORD=your-app-password")
print(f"SMTP_FROM_EMAIL=noreply@panaceon.com")
print(f"REDIS_URL=redis://localhost:6379/0")
print("-" * 80)
print()
print("✓ Secrets generated successfully!")
print("=" * 80)
