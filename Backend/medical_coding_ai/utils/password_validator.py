"""
Password Validation Utility for Panaceon Platform
Enforces password policy: 8-12 alphanumeric characters with uppercase, lowercase, and numbers
"""

import re
from typing import Tuple


def validate_password(password: str, check_history: list = None) -> Tuple[bool, str]:
    """
    Enforce password policy: 8-64 alphanumeric characters
    Must contain:
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number

    Args:
        password: The password to validate
        check_history: Optional list of previous password hashes to check against

    Returns:
        Tuple of (is_valid: bool, error_message: str)
        If valid, error_message will be empty string
    """
    if not password:
        return False, "Password is required"

    # Check minimum length
    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    # Check maximum length (Phase 4: Extended to 64 characters)
    if len(password) > 64:
        return False, "Password must not exceed 64 characters"

    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    # Check for at least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    # Check for at least one number
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"

    # Phase 4: Check password history if provided
    if check_history:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        for old_hash in check_history:
            if pwd_context.verify(password, old_hash):
                return False, "Password has been used recently. Please choose a different password"

    # Optional: Check for special characters (commented out for now as per requirements)
    # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
    #     return False, "Password must contain at least one special character"

    return True, ""


def get_password_strength(password: str) -> int:
    """
    Calculate password strength score (0-4)
    Used for frontend password strength indicator

    Args:
        password: The password to evaluate

    Returns:
        int: Strength score from 0 (weak) to 4 (strong)
    """
    strength = 0

    # Length check
    if len(password) >= 8:
        strength += 1

    # Mixed case check
    if re.search(r'[a-z]', password) and re.search(r'[A-Z]', password):
        strength += 1

    # Numbers check
    if re.search(r'\d', password):
        strength += 1

    # Special characters check
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        strength += 1

    return strength


def get_password_requirements() -> dict:
    """
    Get the password requirements as a dictionary
    Useful for displaying requirements to users

    Returns:
        dict: Password requirements
    """
    return {
        "min_length": 8,
        "max_length": 64,  # Phase 4: Extended from 12 to 64
        "require_uppercase": True,
        "require_lowercase": True,
        "require_number": True,
        "require_special_char": False,
        "password_history_count": 5,  # Phase 4: Track last 5 passwords
        "password_expiry_days": 90,  # Phase 4: Password expires after 90 days
        "description": "Password must be 8-64 characters with uppercase, lowercase, and numbers"
    }


def suggest_password_improvements(password: str) -> list:
    """
    Suggest improvements for a weak password

    Args:
        password: The password to evaluate

    Returns:
        list: List of improvement suggestions
    """
    suggestions = []

    if len(password) < 8:
        suggestions.append("Add more characters (minimum 8 characters)")
    elif len(password) > 64:  # Phase 4: Updated max length
        suggestions.append("Reduce to 64 characters or fewer")

    if not re.search(r'[A-Z]', password):
        suggestions.append("Add at least one uppercase letter")

    if not re.search(r'[a-z]', password):
        suggestions.append("Add at least one lowercase letter")

    if not re.search(r'\d', password):
        suggestions.append("Add at least one number")

    # Optional special character suggestion
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        suggestions.append("Consider adding a special character for extra security (optional)")

    return suggestions
