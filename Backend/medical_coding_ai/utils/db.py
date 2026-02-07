import os
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# ============================================================================
# DATABASE CONFIGURATION (CRITICAL SECURITY)
# ============================================================================
# Database connection string must be provided via environment variable
# Never hardcode credentials in source code!
# ============================================================================

DATABASE_URL = os.getenv('DATABASE_URL')

# Startup validation - fail fast if database URL is missing
if not DATABASE_URL:
    import sys
    error_msg = (
        "\n" + "=" * 80 + "\n"
        "❌ CRITICAL ERROR: DATABASE_URL environment variable is not set!\n"
        "\n"
        "The application cannot start without a database connection.\n"
        "\n"
        "Format: postgresql+asyncpg://username:password@host:port/database\n"
        "Example: postgresql+asyncpg://admin:secure_pass@localhost:5432/multitenant_db\n"
        "\n"
        "For production, add ?ssl=require for encrypted connections:\n"
        "  postgresql+asyncpg://user:pass@host:port/db?ssl=require\n"
        "\n"
        "Set the environment variable:\n"
        "  - Linux/Mac: export DATABASE_URL='your_connection_string'\n"
        "  - Windows: set DATABASE_URL=your_connection_string\n"
        "  - Or add to .env file: DATABASE_URL=your_connection_string\n"
        "\n"
        "⚠️  SECURITY: Never commit database credentials to version control!\n"
        "=" * 80
    )
    print(error_msg, file=sys.stderr)
    sys.exit(1)

# Validate basic format
if not DATABASE_URL.startswith('postgresql'):
    import sys
    error_msg = (
        "\n" + "=" * 80 + "\n"
        "❌ ERROR: DATABASE_URL must be a PostgreSQL connection string\n"
        "\n"
        f"Current value starts with: {DATABASE_URL.split(':')[0]}\n"
        "Expected format: postgresql+asyncpg://username:password@host:port/database\n"
        "=" * 80
    )
    print(error_msg, file=sys.stderr)
    sys.exit(1)

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,  # Validate connections before use
    pool_size=10,  # Connection pool size
    max_overflow=20  # Max overflow connections
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Alias for convenience
async_session = AsyncSessionLocal

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI endpoints"""
    async with AsyncSessionLocal() as session:
        yield session


@asynccontextmanager
async def get_async_session_context():
    """Context manager for standalone scripts"""
    async with AsyncSessionLocal() as session:
        yield session


async def test_connection():
    """Test database connection"""
    try:
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
