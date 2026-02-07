# Panaceon Platform - Quick Start Guide

## 🚀 **Step 1: Backend Setup**

### 1.1 Create Environment File
```bash
cd Backend
copy .env.example .env
```

### 1.2 Edit `.env` File
Open `Backend/.env` and update the following:

```env
# REQUIRED: Database connection
DATABASE_URL=postgresql+asyncpg://admin:your_password@localhost:5432/multitenant_db

# REQUIRED: Security keys (generate new ones)
JWT_SECRET_KEY=your-secret-jwt-key-here
ENCRYPTION_KEY=your-32-character-key-here

# REQUIRED: Email configuration (for user activation)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# REQUIRED: Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 1.3 Generate Secure Keys
```bash
# In Python (or use online generator)
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('ENCRYPTION_KEY=' + secrets.token_urlsafe(32))"
```

### 1.4 Install Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 1.5 Initialize Database
```bash
# Run database initialization script
python init_db.py
```

### 1.6 Start Backend Server
```bash
# CORRECT COMMAND (no --factory flag!)
uvicorn main:app --reload --host localhost --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://localhost:8000
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🎨 **Step 2: Frontend Setup**

### 2.1 Install Dependencies
```bash
cd Frontend
npm install
```

### 2.2 Create Environment File
Create `Frontend/.env` with:
```env
VITE_API_URL=http://localhost:8000
```

### 2.3 Start Frontend Server
```bash
npm run dev
```

**Expected Output:**
```
VITE vx.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

---

## 👤 **Step 3: Create First Admin User**

Since only admins can create users, you need to create the first admin manually:

### Option A: Direct Database Insert (Recommended)
```sql
-- Connect to your database
psql -U admin -d multitenant_db

-- Create first admin (update values)
INSERT INTO users (
    user_id, tenant_id, username, email, password_hash,
    first_name, last_name, role, is_active, email_verified,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'your-tenant-id',
    'admin',
    'admin@yourcompany.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OfmcKVirDy5a',  -- Password: Admin123
    'Platform',
    'Admin',
    'admin',
    true,
    true,
    NOW(),
    NOW()
);
```

### Option B: Use Platform Admin Key Endpoint (If implemented)
```bash
curl -X POST http://localhost:8000/api/auth/platform/create-admin \
  -H "Platform-Key: your-platform-admin-key-from-env" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourcompany.com",
    "password": "Admin123",
    "first_name": "Platform",
    "last_name": "Admin",
    "tenant_id": "your-tenant-id"
  }'
```

---

## 🔐 **Step 4: Login and Test**

### 4.1 Access the Platform
Navigate to: `http://localhost:3000/login`

### 4.2 Login with Admin Credentials
- **Username**: `admin`
- **Password**: `Admin123` (or whatever you set)

### 4.3 Create New Users
1. Navigate to **Admin Settings** → **Create User**
2. Fill in user details
3. User receives activation email (48-hour validity)
4. User clicks activation link
5. User can now log in

---

## 🐛 **Troubleshooting**

### Backend: White Screen / Blank Page
**Cause**: Missing dependencies or import errors

**Fix**:
```bash
cd Frontend
npm install
npm run dev
```

### Backend: `ModuleNotFoundError: No module named 'aiosmtplib'`
**Fix**:
```bash
cd Backend
pip install aiosmtplib
# Or reinstall all
pip install -r requirements.txt
```

### Backend: `ENCRYPTION_KEY not set, using insecure dev key`
**Fix**: Add `ENCRYPTION_KEY` to `Backend/.env`

### Backend: Wrong Uvicorn Command
❌ **WRONG**: `uvicorn main:app --factory --reload`
✅ **CORRECT**: `uvicorn main:app --reload`

### Database Connection Failed
**Fix**: Ensure PostgreSQL is running
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL (if not running)
pg_ctl start
```

### Email Not Sending
**Cause**: Invalid Gmail credentials or 2FA not enabled

**Fix**:
1. Enable 2-Factor Authentication on Gmail
2. Generate App-Specific Password: https://myaccount.google.com/apppasswords
3. Use app password (not your Gmail password) in `.env`

### Port Already in Use
**Backend**:
```bash
# Find process using port 8000
netstat -ano | findstr :8000
# Kill process (replace PID)
taskkill /PID <process_id> /F
```

**Frontend**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill process (replace PID)
taskkill /PID <process_id> /F
```

---

## 📋 **Default Test Credentials**

After creating your first admin, you can create test users:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Admin | admin | admin@test.com | Admin123 |
| Coder | coder1 | coder@test.com | Coder123 |
| Billing | billing1 | billing@test.com | Billing1 |

**Note**: All passwords must be 8-12 characters with uppercase, lowercase, and number.

---

## 🎯 **Next Steps**

1. ✅ Backend running on `http://localhost:8000`
2. ✅ Frontend running on `http://localhost:3000`
3. ✅ Admin user created
4. ✅ Login successful
5. 🔄 Create additional users via Admin panel
6. 🔄 Test email activation flow
7. 🔄 Test password reset flow

---

## 📞 **Support**

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review implementation logs in `.claude/implementation-logs/`
3. Check backend logs for errors
4. Verify all environment variables are set correctly

**Log Files**:
- Backend console output
- Frontend console (browser DevTools → Console)
- Database logs

---

**Last Updated**: December 14, 2024
**Platform**: Panaceon Medical Coding v6.0
