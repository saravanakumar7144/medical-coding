"""
Database initialization script
Creates all tables in the database
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncEngine
from medical_coding_ai.utils.db import engine, Base

# Import all models to register them with Base
from medical_coding_ai.models.user_models import User
from medical_coding_ai.models.tenant_models import Tenant
from medical_coding_ai.models.session_models import UserSession
from medical_coding_ai.models.medical_models import (
    Claim,
    ClaimCode,
    Patient,
    Encounter,
    Denial,
    Appeal
)


async def init_db():
    """Initialize database tables"""
    print("\n" + "=" * 60)
    print("🏗️  Initializing Panaceon Database")
    print("=" * 60)

    try:
        print("\n📋 Creating tables...")

        # Create all tables
        async with engine.begin() as conn:
            # Drop all tables (development only - comment out for production)
            # await conn.run_sync(Base.metadata.drop_all)
            # print("  ✓ Dropped existing tables")

            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("  ✓ Created all tables")

        print("\n✅ Database initialization completed successfully!")
        print("\n📊 Tables created:")
        print("  • users")
        print("  • tenants")
        print("  • user_sessions")
        print("  • patients")
        print("  • encounters")
        print("  • claims")
        print("  • claim_codes")
        print("  • denials")
        print("  • appeals")

        print("\n💡 Next steps:")
        print("  1. Run seed_data.py to create sample users")
        print("  2. Start the backend server")
        print("\n")

    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(init_db())
