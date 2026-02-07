
import asyncio
import os
import sys

# Ensure backend dir is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from medical_coding_ai.utils.db import engine, Base
from medical_coding_ai.models import *

async def init_models():
    print("Connecting to database...")
    async with engine.begin() as conn:
        print("Creating all tables from SQLAlchemy models...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully.")

if __name__ == "__main__":
    # Check for .env file
    if not os.path.exists(".env"):
        print("ERROR: .env file missing in Backend directory.")
        sys.exit(1)
        
    try:
        asyncio.run(init_models())
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)
