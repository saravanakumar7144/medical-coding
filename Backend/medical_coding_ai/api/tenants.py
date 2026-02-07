from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from ..utils.db import get_db
from ..models.tenant_models import Tenant
from ..models.user_models import User
from ..utils.crypto import encrypt, deterministic_hash
from passlib.context import CryptContext
import uuid
import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class TenantRegisterRequest(BaseModel):
    company_name: str
    admin_email: EmailStr
    admin_password: str
    admin_first_name: str
    admin_last_name: str
    plan_tier: str = "standard"

@router.post("/register", status_code=201)
async def register_tenant(payload: TenantRegisterRequest, db: AsyncSession = Depends(get_db)):
    # 1. Check if tenant name (company name) already exists
    # For simplicity, we'll use company name as tenant name, but ensure uniqueness
    q = select(Tenant).where(Tenant.tenant_name == payload.company_name)
    res = await db.execute(q)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Company name already registered")

    # 2. Check if admin email already exists (globally or just check username)
    q_user = select(User).where(User.username == payload.admin_email)
    res_user = await db.execute(q_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 3. Create Tenant
    new_tenant_id = uuid.uuid4()
    
    # Encrypt contact info
    email_encrypted = encrypt(payload.admin_email)
    
    stmt_tenant = insert(Tenant).values(
        tenant_id=new_tenant_id,
        tenant_name=payload.company_name,
        company_name=payload.company_name,
        enrollment_tier=payload.plan_tier,
        contact_email_hash=deterministic_hash(payload.admin_email),
        contact_email_encrypted=email_encrypted,
        max_users=5, # Default for now
        max_storage_gb=10, # Default
        is_active=True
    )
    await db.execute(stmt_tenant)

    # 4. Create Admin User
    hashed_password = pwd_context.hash(payload.admin_password)
    
    stmt_user = insert(User).values(
        tenant_id=new_tenant_id,
        username=payload.admin_email,
        email_encrypted=email_encrypted,
        dec_hash=deterministic_hash(payload.admin_email),
        password_hash=hashed_password,
        first_name_encrypted=encrypt(payload.admin_first_name),
        last_name_encrypted=encrypt(payload.admin_last_name),
        role='admin',
        mfa_enabled=False, # Optional for initial setup
        is_active=True
    ).returning(User.user_id)

    result = await db.execute(stmt_user)
    new_user_id = result.scalar_one()
    
    await db.commit()

    return {
        "tenant_id": str(new_tenant_id),
        "company_name": payload.company_name,
        "admin_id": str(new_user_id),
        "message": "Tenant registered successfully"
    }
