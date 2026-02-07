"""
Test Configuration and Fixtures
Provides test database, client, and common fixtures for all tests
"""

import os
import sys
import asyncio
import pytest
import uuid
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# Add Backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from medical_coding_ai.utils.db import Base
from medical_coding_ai.api.deps import get_db
from main import app

# Test database URL (use a separate test database)
TEST_DATABASE_URL = os.getenv(
    'TEST_DATABASE_URL',
    'postgresql+asyncpg://admin:vicky111@localhost:7080/multitenant_db'
)

# Test configuration
TEST_TENANT_ID = str(uuid.uuid4())
TEST_USER_ID = str(uuid.uuid4())
TEST_USERNAME = "testuser"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after tests (with CASCADE to handle views)
    async with engine.begin() as conn:
        # Drop views first if they exist
        await conn.execute(text("DROP VIEW IF EXISTS vw_claim_summary CASCADE"))
        await conn.execute(text("DROP VIEW IF EXISTS vw_denial_analysis CASCADE"))
        # Then drop tables
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a new database session for each test."""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Test user registration data."""
    return {
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "first_name": "Test",
        "last_name": "User",
        "role": "coder",
        "tenant_id": TEST_TENANT_ID
    }


@pytest.fixture
def test_login_data():
    """Test user login credentials."""
    return {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }


@pytest.fixture
async def activated_user(client: AsyncClient, test_user_data, db_session: AsyncSession):
    """Create and activate a test user."""
    from medical_coding_ai.models.user_models import User
    from medical_coding_ai.utils.crypto import encrypt
    from passlib.context import CryptContext
    from sqlalchemy import select
    import datetime

    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # Check if user already exists
    stmt = select(User).where(User.username == test_user_data["username"])
    result = await db_session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return existing_user

    # Create user
    user = User(
        user_id=uuid.uuid4(),
        tenant_id=uuid.UUID(test_user_data["tenant_id"]),
        username=test_user_data["username"],
        email_encrypted=encrypt(test_user_data["email"]),
        dec_hash=pwd_context.hash(test_user_data["email"]),
        password_hash=pwd_context.hash(test_user_data["password"]),
        first_name_encrypted=encrypt(test_user_data["first_name"]),
        last_name_encrypted=encrypt(test_user_data["last_name"]),
        role=test_user_data["role"],
        is_active=True,
        email_verified=True,
        email_verified_at=datetime.datetime.utcnow(),
        failed_login_attempts=0
    )

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest.fixture
async def auth_token(client: AsyncClient, activated_user, test_login_data):
    """Get authentication token for an activated user."""
    response = await client.post(
        "/api/auth/login",
        json=test_login_data
    )

    assert response.status_code == 200
    data = response.json()
    return data["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get authorization headers with token."""
    return {
        "Authorization": f"Bearer {auth_token}"
    }
