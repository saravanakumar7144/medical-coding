import asyncio
import os
import sys

# Add project root to path (Backend directory, two levels up from scripts/initialization/)
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.insert(0, backend_root)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import text
from medical_coding_ai.utils.db import engine, Base
from medical_coding_ai.models import user_models, session_models, tenant_models, medical_models

async def init_models():
    async with engine.begin() as conn:
        # Drop all tables with CASCADE
        await conn.execute(text("""
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
        """))
        print("Dropped all tables.")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
