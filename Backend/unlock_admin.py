"""
Script to unlock the admin account that was locked due to failed login attempts.
"""
import asyncio
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from sqlalchemy import select, update
from medical_coding_ai.utils.db import get_engine, async_session
from medical_coding_ai.models.user_models import User

async def unlock_admin():
    print("Connecting to database...")
    
    async with async_session() as session:
        # Find the admin user
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("ERROR: Admin user not found!")
            return False
        
        print(f"Found admin user: {admin_user.username}")
        print(f"Current failed_login_attempts: {admin_user.failed_login_attempts}")
        print(f"Current locked_until: {admin_user.locked_until}")
        
        # Reset the lock
        admin_user.failed_login_attempts = 0
        admin_user.locked_until = None
        
        await session.commit()
        
        print("\n✅ Admin account unlocked successfully!")
        print("   - failed_login_attempts reset to 0")
        print("   - locked_until cleared")
        return True

if __name__ == "__main__":
    if not os.path.exists(".env"):
        print("ERROR: .env file missing in Backend directory.")
        sys.exit(1)
    
    try:
        asyncio.run(unlock_admin())
    except Exception as e:
        print(f"Error unlocking admin: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
