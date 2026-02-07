#!/usr/bin/env python3
"""
Phase 3 Verification Script
Checks that all Phase 3 implementations are correctly set up
"""

import os
import sys
from pathlib import Path
import importlib.util


def print_header(text):
    """Print formatted header."""
    print(f"\n{'=' * 80}")
    print(f"  {text}")
    print(f"{'=' * 80}\n")


def print_check(name, passed, details=""):
    """Print check result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if details:
        print(f"       {details}")


def check_dependencies():
    """Check if required dependencies are installed."""
    print_header("Checking Dependencies")

    required = {
        'pytest': 'Testing framework',
        'httpx': 'HTTP client for tests',
        'slowapi': 'Rate limiting',
        'pytest_asyncio': 'Async test support'
    }

    all_good = True
    for package, description in required.items():
        try:
            spec = importlib.util.find_spec(package)
            installed = spec is not None
            print_check(f"{package} ({description})", installed)
            if not installed:
                all_good = False
        except Exception:
            print_check(f"{package} ({description})", False)
            all_good = False

    return all_good


def check_test_files():
    """Check if test files exist."""
    print_header("Checking Test Files")

    test_dir = Path(__file__).parent / 'tests'
    required_files = [
        'conftest.py',
        'test_authentication.py',
        'test_security.py',
        'test_integration.py',
        '__init__.py'
    ]

    all_good = True
    for filename in required_files:
        filepath = test_dir / filename
        exists = filepath.exists()
        print_check(filename, exists, f"Path: {filepath}")
        if not exists:
            all_good = False

    return all_good


def check_migration_files():
    """Check if migration files exist."""
    print_header("Checking Migration Files")

    migrations_dir = Path(__file__).parent / 'migrations'
    required_files = [
        '001_add_email_verification_expires.sql',
        '002_add_refresh_tokens_table.sql',
        '003_add_legal_acceptance_fields.sql',
        'README.md'
    ]

    all_good = True
    for filename in required_files:
        filepath = migrations_dir / filename
        exists = filepath.exists()
        print_check(filename, exists, f"Path: {filepath}")
        if not exists:
            all_good = False

    return all_good


def check_environment():
    """Check critical environment variables."""
    print_header("Checking Environment Variables")

    required = [
        'ENCRYPTION_KEY',
        'JWT_SECRET_KEY',
        'DATABASE_URL'
    ]

    optional = [
        'CORS_ALLOWED_ORIGINS',
        'REDIS_URL',
        'FRONTEND_URL'
    ]

    all_good = True
    for var in required:
        value = os.getenv(var)
        is_set = value is not None and value != ''
        print_check(f"{var} (REQUIRED)", is_set)
        if not is_set:
            all_good = False

    print()
    for var in optional:
        value = os.getenv(var)
        is_set = value is not None and value != ''
        print_check(f"{var} (optional)", is_set)

    return all_good


def check_code_changes():
    """Check if Phase 3 code changes are present."""
    print_header("Checking Code Changes")

    checks = []

    # Check rate limiting in main.py
    main_py = Path(__file__).parent / 'main.py'
    if main_py.exists():
        content = main_py.read_text()
        has_slowapi = 'slowapi' in content
        has_limiter = 'Limiter' in content
        checks.append(("Rate limiting in main.py", has_slowapi and has_limiter))
    else:
        checks.append(("main.py exists", False))

    # Check legal acceptance in auth.py
    auth_py = Path(__file__).parent / 'medical_coding_ai' / 'api' / 'auth.py'
    if auth_py.exists():
        content = auth_py.read_text()
        has_legal_endpoint = '/accept-legal' in content
        has_legal_model = 'LegalAcceptanceRequest' in content
        checks.append(("Legal acceptance endpoint", has_legal_endpoint))
        checks.append(("Legal acceptance model", has_legal_model))
    else:
        checks.append(("auth.py exists", False))

    # Check user model updates
    user_models = Path(__file__).parent / 'medical_coding_ai' / 'models' / 'user_models.py'
    if user_models.exists():
        content = user_models.read_text()
        has_terms = 'terms_accepted' in content
        has_privacy = 'privacy_policy_accepted' in content
        checks.append(("User model - terms_accepted", has_terms))
        checks.append(("User model - privacy_policy_accepted", has_privacy))
    else:
        checks.append(("user_models.py exists", False))

    all_good = True
    for name, passed in checks:
        print_check(name, passed)
        if not passed:
            all_good = False

    return all_good


def check_documentation():
    """Check if documentation files exist."""
    print_header("Checking Documentation")

    root = Path(__file__).parent.parent
    docs = [
        ('TEST_SUITE_SUMMARY.md', root / 'TEST_SUITE_SUMMARY.md'),
        ('RATE_LIMITING_SUMMARY.md', root / 'RATE_LIMITING_SUMMARY.md'),
        ('IMPLEMENTATION_PHASES.md', root / 'IMPLEMENTATION_PHASES.md'),
        ('Session Summary', root / '.claude' / 'implementation-logs' / 'session-2025-12-16-phase3-completion.md')
    ]

    all_good = True
    for name, path in docs:
        exists = path.exists()
        print_check(name, exists, f"Path: {path}")
        if not exists:
            all_good = False

    return all_good


def main():
    """Run all verification checks."""
    print_header("Phase 3 Verification - Panaceon V-06")
    print("Verifying all Phase 3 implementations are in place...")

    results = {
        "Dependencies": check_dependencies(),
        "Test Files": check_test_files(),
        "Migration Files": check_migration_files(),
        "Environment Variables": check_environment(),
        "Code Changes": check_code_changes(),
        "Documentation": check_documentation()
    }

    # Summary
    print_header("Verification Summary")

    all_passed = all(results.values())

    for category, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {category}")

    print(f"\n{'=' * 80}")
    if all_passed:
        print("✅ All verification checks PASSED!")
        print("\nNext steps:")
        print("  1. Run tests: pytest -v")
        print("  2. Apply database migration: psql -U admin -d multitenant_db")
        print("     \\i migrations/003_add_legal_acceptance_fields.sql")
        print("  3. Manual testing of rate limiting and legal flows")
        print("  4. Review session summary document")
    else:
        print("❌ Some verification checks FAILED!")
        print("\nPlease review the failed checks above and fix any issues.")
        print("Common fixes:")
        print("  - Install dependencies: pip install -r requirements.txt")
        print("  - Set environment variables in .env file")
        print("  - Ensure all code changes have been applied")
    print(f"{'=' * 80}\n")

    return 0 if all_passed else 1


if __name__ == '__main__':
    sys.exit(main())
