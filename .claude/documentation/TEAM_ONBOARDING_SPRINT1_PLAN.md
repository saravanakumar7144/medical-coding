# Panaceon V-06 - Team Onboarding & Sprint 1 Implementation Plan
**Document Version:** 1.0
**Created:** January 13, 2026
**Duration:** 1 Week Sprint
**Team Size:** 4 Engineers
**Project:** Medical Coding AI Platform

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Backend Structure](#3-backend-structure)
4. [Frontend Structure](#4-frontend-structure)
5. [Current Implementation Status](#5-current-implementation-status)
6. [Database Schema](#6-database-schema)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Sprint 1 Task Assignments](#8-sprint-1-task-assignments)
9. [Detailed Implementation Guides](#9-detailed-implementation-guides)
10. [Testing Procedures](#10-testing-procedures)
11. [Milestones & Deliverables](#11-milestones--deliverables)
12. [Quick Reference](#12-quick-reference)

---

# 1. PROJECT OVERVIEW

## 1.1 What is Panaceon?

**Panaceon V-06** is a comprehensive Medical Coding AI Platform designed for healthcare organizations. It automates medical billing code assignment, claims management, and revenue cycle management while maintaining HIPAA compliance.

### Key Features
- AI-powered medical code suggestions (ICD-10, CPT, HCPCS)
- Claims lifecycle management
- Revenue cycle analytics
- Multi-tenant architecture
- Role-based access control (6 roles)
- Security monitoring and audit trails
- EHR integration capabilities

### Target Users
| Role | Description |
|------|-------------|
| **Admin** | System administrators managing users, settings, security |
| **Coder** | Medical coders assigning diagnosis and procedure codes |
| **Biller** | Billing specialists handling claims and payments |
| **Manager** | Team managers overseeing operations and performance |
| **Executive** | Leadership viewing high-level KPIs and reports |
| **Auditor** | Compliance auditors reviewing activities and trails |

---

# 2. TECH STACK & ARCHITECTURE

## 2.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend Framework** | FastAPI | 0.104+ |
| **Backend Language** | Python | 3.13 |
| **Database** | PostgreSQL | 15+ |
| **ORM** | SQLAlchemy (async) | 2.0+ |
| **Frontend Framework** | React | 18.2+ |
| **Frontend Language** | TypeScript | 5.0+ |
| **Build Tool** | Vite | 5.0+ |
| **Styling** | TailwindCSS | 3.4+ |
| **UI Components** | shadcn/ui | Latest |
| **Charts** | Recharts | 2.15+ |
| **Authentication** | JWT (HS256) | - |
| **Password Hashing** | bcrypt | 12 rounds |
| **Encryption** | Fernet (AES-128) | - |
| **Rate Limiting** | SlowAPI | 0.1.9+ |
| **Caching** | Redis (optional) | 7+ |

## 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Login   │ │Dashboard│ │ Claims  │ │ Admin   │ │Analytics│   │
│  │  Page   │ │ (6 roles)│ │  Inbox  │ │Settings │ │  Page   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │          │
│       └───────────┴───────────┴───────────┴───────────┘          │
│                              │                                    │
│                    ┌─────────┴─────────┐                         │
│                    │   Auth Context    │                         │
│                    │   + Services      │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      Middleware Stack                        │ │
│  │  SecurityHeaders → AuditLog → CORS → RateLimiter            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Auth   │ │  Admin  │ │Security │ │Analytics│ │ Claims  │   │
│  │  API    │ │   API   │ │   API   │ │   API   │ │   API   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       └───────────┴───────────┴───────────┴───────────┘          │
│                              │                                    │
│                    ┌─────────┴─────────┐                         │
│                    │   SQLAlchemy ORM  │                         │
│                    └─────────┬─────────┘                         │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Users  │ │ Tenants │ │  Audit  │ │Security │ │ Claims  │   │
│  │         │ │         │ │  Logs   │ │ Events  │ │         │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

# 3. BACKEND STRUCTURE

## 3.1 Directory Structure

```
Backend/
├── medical_coding_ai/
│   ├── api/                    # API route handlers
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── admin.py            # Admin management endpoints
│   │   ├── analytics.py        # Analytics/reporting endpoints
│   │   ├── security_monitoring.py  # Security dashboard endpoints
│   │   ├── claims.py           # Claims management endpoints
│   │   ├── ehr.py              # EHR integration endpoints
│   │   ├── sessions.py         # Session management
│   │   ├── tenants.py          # Tenant management
│   │   ├── health.py           # Health check endpoints
│   │   └── deps.py             # Shared dependencies (auth, db)
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── user_models.py      # User, AuditLog, PasswordReset
│   │   ├── security_models.py  # SecurityEvent, LoginAttempt
│   │   ├── tenant_models.py    # Tenant, settings
│   │   ├── claims_models.py    # Patient, Encounter, Claim
│   │   └── settings_models.py  # AI/Security settings
│   │
│   ├── utils/                  # Utility modules
│   │   ├── crypto.py           # Encryption/decryption
│   │   ├── email_service.py    # Email sending
│   │   ├── password_validator.py  # Password validation
│   │   ├── db.py               # Database connection
│   │   └── redis_client.py     # Redis connection
│   │
│   ├── middleware/             # FastAPI middleware
│   │   ├── audit.py            # Audit logging middleware
│   │   └── security_headers.py # Security headers
│   │
│   └── jobs/                   # Background jobs
│       └── cleanup.py          # Token cleanup jobs
│
├── scripts/
│   └── initialization/
│       └── seed_admin.py       # Initial admin user seeding
│
├── main.py                     # FastAPI application entry point
├── init_db.py                  # Database initialization
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
└── .env.example                # Environment template
```

## 3.2 API Modules Details

### auth.py - Authentication Module
**File:** `Backend/medical_coding_ai/api/auth.py`
**Status:** ✅ Fully Implemented

| Endpoint | Method | Purpose | Rate Limit |
|----------|--------|---------|------------|
| `/api/auth/signin` | POST | User login | 5/minute |
| `/api/auth/logout` | POST | Logout + token blacklist | - |
| `/api/auth/refresh` | POST | Refresh access token | - |
| `/api/auth/me` | GET | Get current user | - |
| `/api/auth/users` | POST | Create user (admin) | 10/hour |
| `/api/auth/activate-account` | POST | Activate account | 10/hour |
| `/api/auth/forgot-password` | POST | Request password reset | 3/hour |
| `/api/auth/reset-password` | POST | Reset password | 3/hour |
| `/api/auth/accept-legal` | POST | Accept T&C/Privacy | - |
| `/api/auth/mfa/setup` | POST | Setup TOTP MFA | - |
| `/api/auth/mfa/verify` | POST | Verify TOTP code | - |

### admin.py - Admin Management Module
**File:** `Backend/medical_coding_ai/api/admin.py`
**Status:** 🔄 Partially Implemented

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/admin/users` | GET | List all users | ✅ |
| `/api/admin/users` | POST | Create user | ✅ |
| `/api/admin/users/{id}` | PATCH | Update user | ✅ |
| `/api/admin/users/{id}` | DELETE | Soft delete user | ✅ |
| `/api/admin/system/metrics` | GET | System metrics | ✅ |
| `/api/admin/ai-settings` | GET/PATCH | AI configuration | 🔄 |
| `/api/admin/security-settings` | GET/PATCH | Security config | 🔄 |
| `/api/admin/audit-logs` | GET | Audit trail | ❌ Needs creation |

### security_monitoring.py - Security Module
**File:** `Backend/medical_coding_ai/api/security_monitoring.py`
**Status:** ✅ Fully Implemented

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/security/dashboard` | GET | Security metrics dashboard |
| `/api/security/events` | GET | List security events (paginated) |
| `/api/security/events/{id}/resolve` | POST | Mark event resolved |
| `/api/security/login-attempts` | GET | List login attempts |
| `/api/security/metrics` | GET | 30-day security metrics |

### analytics.py - Analytics Module
**File:** `Backend/medical_coding_ai/api/analytics.py`
**Status:** ✅ Fully Implemented

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/productivity` | GET | Charts coded per day |
| `/api/analytics/accuracy` | GET | AI confidence, error rates |
| `/api/analytics/revenue` | GET | Revenue trends |
| `/api/analytics/coding-distribution` | GET | Code type distribution |
| `/api/analytics/coder-performance` | GET | Per-coder metrics |
| `/api/analytics/compliance-issues` | GET | Compliance tracking |

---

# 4. FRONTEND STRUCTURE

## 4.1 Directory Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── admin/                  # Admin-specific components
│   │   │   └── create-user.tsx     # User creation form
│   │   │
│   │   ├── auth/                   # Authentication components
│   │   │   ├── login-page.tsx      # Login form
│   │   │   ├── forgot-password.tsx # Password reset request
│   │   │   ├── reset-password.tsx  # Password reset form
│   │   │   └── activate-account.tsx # Account activation
│   │   │
│   │   ├── role-dashboards/        # Role-specific dashboards
│   │   │   ├── enhanced-admin-dashboard.tsx
│   │   │   ├── enhanced-coder-dashboard.tsx
│   │   │   ├── enhanced-biller-dashboard.tsx
│   │   │   ├── enhanced-manager-dashboard.tsx
│   │   │   ├── enhanced-executive-dashboard.tsx
│   │   │   └── enhanced-auditor-dashboard.tsx
│   │   │
│   │   ├── claims/                 # Claims-related components
│   │   │   ├── patient-management.tsx
│   │   │   └── revenue-metrics.tsx
│   │   │
│   │   ├── legal/                  # Legal components
│   │   │   ├── terms-and-conditions.tsx
│   │   │   └── privacy-policy.tsx
│   │   │
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ... (50+ UI components)
│   │   │
│   │   ├── admin-settings.tsx      # Admin settings page
│   │   ├── analytics.tsx           # Analytics page
│   │   ├── claims-inbox.tsx        # Claims inbox
│   │   ├── chart-coding.tsx        # Chart coding workspace
│   │   └── ... (30+ page components)
│   │
│   ├── contexts/
│   │   └── auth-context.tsx        # Authentication context
│   │
│   ├── services/
│   │   └── auth-service.ts         # Auth API service
│   │
│   ├── types/
│   │   ├── auth.ts                 # Auth type definitions
│   │   └── role-permissions.ts     # Role permissions
│   │
│   ├── App.tsx                     # Main app with routing
│   └── main.tsx                    # Entry point
│
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── .env                            # Environment variables
```

## 4.2 Frontend Routes

| URL Path | Component | Data Status | Description |
|----------|-----------|-------------|-------------|
| `/login` | LoginPage | ✅ Real API | User authentication |
| `/forgot-password` | ForgotPassword | ✅ Real API | Password reset request |
| `/reset-password` | ResetPassword | ✅ Real API | Set new password |
| `/activate` | ActivateAccount | ✅ Real API | Account activation |
| `/dashboard` | Role-based | ❌ Mock | Main dashboard (6 variants) |
| `/claims-inbox` | ClaimsInbox | ❌ Mock | Claims list |
| `/chart-coding` | ChartCoding | ✅ Real API | Coding workspace |
| `/denials-workbench` | EnhancedDenialsWorkbench | ✅ API+fallback | Denials management |
| `/submissions-acks` | EnhancedSubmissionsAcks | ❌ Mock | Submissions tracking |
| `/eras-payments` | EnhancedERAsPayments | ❌ Mock | Payment posting |
| `/admin-settings` | AdminSettings | ❌ Mock | Admin configuration |
| `/reports-analytics` | EnhancedReportsAnalytics | ❌ Mock | Reports & analytics |
| `/analytics` | Analytics | ❌ Mock | Analytics dashboard |
| `/patients` | PatientManagement | ❌ Mock | Patient records |
| `/revenue-metrics` | RevenueMetrics | ❌ Mock | Revenue tracking |

---

# 5. CURRENT IMPLEMENTATION STATUS

## 5.1 Status Legend
- ✅ **Complete** - Fully implemented and working
- 🔄 **Partial** - Partially implemented, needs work
- ❌ **Mock** - Using static mock data, needs API integration
- 🆕 **New** - Not yet started, needs creation

## 5.2 Feature Status Matrix

### Authentication Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| User Login | ✅ | ✅ | ✅ Complete |
| User Logout | ✅ | ✅ | ✅ Complete |
| Token Refresh | ✅ | ✅ | ✅ Complete |
| Password Reset | ✅ | ✅ | ✅ Complete |
| Account Activation | ✅ | ✅ | ✅ Complete |
| Remember Me | ✅ | ✅ | ✅ Complete |
| MFA (TOTP) | ✅ | 🔄 Stub | 🔄 Backend ready |
| Terms Acceptance | ✅ | ✅ | ✅ Complete |

### Dashboard Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| User Count Display | ✅ API exists | ❌ Mock | ❌ Needs wiring |
| Security Alerts | ✅ API exists | ❌ Mock | ❌ Needs wiring |
| Recent Activity | ✅ API exists | ❌ Mock | ❌ Needs wiring |
| Role-based Views | ✅ | ✅ | ✅ Structure ready |

### Admin Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| User List | ✅ | ❌ Mock | ❌ Needs wiring |
| User Create | ✅ | ✅ | ✅ Works |
| User Edit | ✅ | ❌ Mock | ❌ Needs wiring |
| User Delete | ✅ | ❌ Mock | ❌ Needs wiring |
| AI Settings | 🔄 | ❌ Empty | 🔄 Needs work |
| Security Settings | 🔄 | ❌ Empty | 🔄 Needs work |
| Audit Trails | 🆕 Needs endpoint | ❌ Empty | 🆕 Needs creation |

### Security Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| Login Attempt Logging | ✅ | ❌ No display | ❌ Needs UI |
| Security Events | ✅ | ❌ No display | ❌ Needs UI |
| Security Dashboard | ✅ | ❌ Not connected | ❌ Needs wiring |
| Event Resolution | ✅ | ❌ No UI | ❌ Needs UI |

### Analytics Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| Productivity Charts | ✅ | ❌ Mock data | ❌ Needs wiring |
| Accuracy Metrics | ✅ | ❌ Mock data | ❌ Needs wiring |
| Revenue Analytics | ✅ | ❌ Mock data | ❌ Needs wiring |
| Coder Performance | ✅ | ❌ Mock data | ❌ Needs wiring |

### Claims Features

| Feature | Backend | Frontend | Overall |
|---------|---------|----------|---------|
| Claims Inbox | ✅ | ❌ Mock | ❌ Needs wiring |
| Chart Coding | ✅ | ✅ | ✅ Works |
| Denials Workbench | ✅ | ✅ + fallback | ✅ Works |
| Submissions | 🔄 | ❌ Mock | 🔄 Needs work |

---

# 6. DATABASE SCHEMA

## 6.1 Core Tables

### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,

    -- Authentication
    username VARCHAR(100) NOT NULL,
    email_encrypted BYTEA NOT NULL,
    dec_hash VARCHAR(64) NOT NULL,  -- For email uniqueness
    password_hash VARCHAR(255) NOT NULL,

    -- Profile (Encrypted)
    first_name_encrypted BYTEA,
    last_name_encrypted BYTEA,
    phone_encrypted BYTEA,
    dob_encrypted BYTEA,
    ssn_encrypted BYTEA,
    employee_id VARCHAR(50),

    -- Role & Access
    role VARCHAR(20) DEFAULT 'coder',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,

    -- Email Verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token_hash VARCHAR(255),
    email_verification_expires TIMESTAMP,
    email_verified_at TIMESTAMP,

    -- Login Tracking
    last_login_at TIMESTAMP,
    last_login_ip_encrypted BYTEA,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,

    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret_encrypted BYTEA,
    mfa_backup_codes_encrypted BYTEA,

    -- Legal Acceptance
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    privacy_policy_accepted BOOLEAN DEFAULT FALSE,
    privacy_policy_accepted_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,

    UNIQUE(tenant_id, username),
    UNIQUE(tenant_id, dec_hash)
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,

    -- Action Details
    action_type VARCHAR(100),
    action_category VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Request Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id UUID,
    session_id UUID,
    api_endpoint VARCHAR(255),
    http_method VARCHAR(10),

    -- Result
    status VARCHAR(20),  -- 'success' or 'failure'
    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
```

### Security Events Table
```sql
CREATE TABLE security_events (
    event_id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(tenant_id),
    user_id UUID REFERENCES users(user_id),

    -- Event Info
    event_type VARCHAR(50),  -- 'failed_login', 'suspicious_activity', etc.
    severity VARCHAR(20) DEFAULT 'low',  -- 'low', 'medium', 'high', 'critical'

    -- Location
    ip_address TEXT,  -- Encrypted
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),

    -- Details
    details JSONB,

    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(user_id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_events_severity ON security_events(severity, resolved, created_at DESC);
```

### Login Attempts Table
```sql
CREATE TABLE login_attempts (
    attempt_id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,

    -- Attempt Details
    username VARCHAR(100),
    success BOOLEAN,
    failure_reason VARCHAR(100),

    -- Context
    ip_address TEXT,  -- Encrypted
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),

    -- MFA
    mfa_required BOOLEAN,
    mfa_success BOOLEAN,
    mfa_method VARCHAR(20),

    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_user ON login_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(tenant_id, success, attempted_at DESC) WHERE success = FALSE;
```

---

# 7. API ENDPOINTS REFERENCE

## 7.1 Authentication Endpoints

### POST /api/auth/signin
**Purpose:** User login

**Request:**
```json
{
  "username": "admin",
  "password": "Admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### GET /api/auth/me
**Purpose:** Get current user info

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "id": "uuid-here",
  "email": "admin@test.com",
  "name": "Platform Admin",
  "roles": ["admin"],
  "activeRole": "admin",
  "mfaEnabled": false,
  "termsAccepted": true,
  "privacyPolicyAccepted": true
}
```

## 7.2 Security Endpoints

### GET /api/security/dashboard
**Purpose:** Security metrics dashboard

**Query Parameters:**
- `range`: `1h` | `24h` | `7d` | `30d` (default: `24h`)

**Response:**
```json
{
  "summary": {
    "total_events": 45,
    "critical_events": 2,
    "high_events": 8,
    "medium_events": 15,
    "low_events": 20,
    "unresolved_events": 12
  },
  "recent_events": [...],
  "failed_login_trend": [
    {"date": "2026-01-07", "count": 5},
    {"date": "2026-01-08", "count": 3}
  ],
  "top_countries": [
    {"country": "United States", "count": 30}
  ]
}
```

### GET /api/security/login-attempts
**Purpose:** List login attempts

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `success`: Filter by success (true/false)

**Response:**
```json
{
  "items": [
    {
      "attempt_id": "uuid",
      "username": "admin",
      "success": true,
      "failure_reason": null,
      "ip_address": "192.168.1.xxx",
      "user_agent": "Mozilla/5.0...",
      "country": "United States",
      "attempted_at": "2026-01-13T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

## 7.3 Admin Endpoints

### GET /api/admin/users
**Purpose:** List all users

**Query Parameters:**
- `role`: Filter by role
- `active`: Filter by active status

**Response:**
```json
{
  "users": [
    {
      "user_id": "uuid",
      "username": "admin",
      "email": "admin@test.com",
      "first_name": "Platform",
      "last_name": "Admin",
      "role": "admin",
      "is_active": true,
      "last_login_at": "2026-01-13T10:00:00Z"
    }
  ]
}
```

## 7.4 Analytics Endpoints

### GET /api/analytics/productivity
**Purpose:** Get productivity metrics

**Query Parameters:**
- `days`: Number of days (default: 30)

**Response:**
```json
{
  "charts_coded_by_day": [
    {"date": "2026-01-01", "count": 45},
    {"date": "2026-01-02", "count": 52}
  ],
  "average_codes_per_chart": 3.2,
  "total_charts_coded": 1500
}
```

---

# 8. SPRINT 1 TASK ASSIGNMENTS

## 8.1 Team Assignment Overview

| Engineer | Focus Area | Primary Responsibility |
|----------|------------|----------------------|
| **Engineer 1** | Security & Audit | Login tracking, Security alerts, Audit trails |
| **Engineer 2** | Dashboard & Analytics | Dashboard stats, Activity feed, Charts |
| **Engineer 3** | Admin & User Management | User CRUD, Admin settings tabs |
| **Engineer 4** | Claims & Submissions | Claims inbox, Submissions page |

---

## 8.2 Engineer 1: Security & Audit Features

### Task 1.1: Login Attempts Display
**Priority:** P0 - High
**Estimate:** 4-6 hours

**Goal:** Display login attempts in Admin Settings → Audit Workflows tab

**Backend (Already Done):**
- Endpoint: `GET /api/security/login-attempts`
- Returns paginated login attempts with IP, user agent, success/failure

**Frontend Work:**
1. Create service file: `Frontend/src/services/security-service.ts`
2. Create component: `Frontend/src/components/security/login-attempts-table.tsx`
3. Add to Admin Settings Audit Workflows tab

**Implementation Steps:**
1. Create the service file with API calls
2. Create table component with columns:
   - S.No
   - Timestamp
   - User
   - Status (Success/Failure badge)
   - IP Address (masked for security)
   - Browser/User Agent
   - Failure Reason (if failed)
3. Add pagination controls
4. Add to AdminSettings under Audit Workflows tab
5. Test with real data

**Acceptance Criteria:**
- [ ] Login attempts visible in Admin Settings
- [ ] Pagination works (20 items per page)
- [ ] Success shown in green, failures in red
- [ ] IP addresses partially masked

---

### Task 1.2: Security Alerts Dashboard
**Priority:** P0 - High
**Estimate:** 3-4 hours

**Goal:** Make Security Alerts card on dashboard show real data

**Backend (Already Done):**
- Endpoint: `GET /api/security/dashboard?range=24h`

**Frontend Work:**
1. Update: `Frontend/src/components/role-dashboards/enhanced-admin-dashboard.tsx`
2. Replace mock `securityAlerts` data with API call

**Implementation Steps:**
1. Add security dashboard fetch to component mount
2. Map response to existing card format:
   - Total alerts count
   - Critical alerts count
   - Unresolved count
3. Add loading state
4. Add error handling with fallback

**Acceptance Criteria:**
- [ ] Dashboard shows real alert counts
- [ ] Updates on page refresh
- [ ] Shows loading state while fetching
- [ ] Graceful error handling

---

### Task 1.3: Audit Trails Table
**Priority:** P1 - Medium
**Estimate:** 6-8 hours

**Goal:** Create complete Audit Trails view in Admin Settings

**Backend Work Needed:**
1. Create new endpoint: `GET /api/admin/audit-logs`
2. Add to `admin.py`

**Frontend Work:**
1. Create: `Frontend/src/components/admin/audit-trails.tsx`
2. Add to Admin Settings → Audit Workflows tab

**Table Structure:**
| S.No | Timestamp | User | Role | Source (IP & Browser) | Outcome | Action |

**Implementation Steps:**
1. **Backend:** Create audit-logs endpoint with pagination
2. **Frontend:** Create table component
3. Add filtering by:
   - Date range
   - User
   - Action type
   - Status (success/failure)
4. Add export capability (optional)
5. Integrate into Admin Settings

**Acceptance Criteria:**
- [ ] Audit logs visible in Admin Settings
- [ ] Shows user, action, outcome for each entry
- [ ] Pagination works
- [ ] Can filter by date range

---

## 8.3 Engineer 2: Dashboard & Analytics Features

### Task 2.1: Dashboard User Statistics
**Priority:** P0 - High
**Estimate:** 3-4 hours

**Goal:** Make dashboard show real user counts and activity stats

**Backend (Available):**
- `GET /api/admin/users` - User list
- `GET /api/admin/system/metrics` - System metrics

**Frontend Work:**
- Update all 6 role dashboards to fetch real stats

**Stats to Display:**
- Total users count
- Active users (logged in last 30 days)
- New users this month
- System uptime (from health check)

**Implementation Steps:**
1. Create `admin-service.ts` with user count functions
2. Update `enhanced-admin-dashboard.tsx`:
   - Replace mock `stats` array
   - Fetch from API on mount
3. Calculate active users from `last_login_at`
4. Add loading states

**Acceptance Criteria:**
- [ ] User count is real
- [ ] Active users calculated correctly
- [ ] Stats update on page refresh

---

### Task 2.2: Recent Activity Timeline
**Priority:** P1 - Medium
**Estimate:** 4-5 hours

**Goal:** Show real activity feed on dashboard

**Backend (Available):**
- `GET /api/security/events?limit=10`

**Frontend Work:**
- Update dashboard to show recent security events

**Implementation Steps:**
1. Fetch recent events from security API
2. Transform to activity feed format:
   - Icon based on event type
   - Description
   - Timestamp
   - User name
3. Show in "Recent Activity" section
4. Add "View All" link to full audit page

**Acceptance Criteria:**
- [ ] Recent activities show real events
- [ ] Proper icons for event types
- [ ] Timestamps formatted nicely

---

### Task 2.3: Analytics Charts
**Priority:** P1 - Medium
**Estimate:** 5-6 hours

**Goal:** Wire analytics page to real API data

**Backend (Available):**
- `GET /api/analytics/productivity`
- `GET /api/analytics/accuracy`
- `GET /api/analytics/revenue`

**Frontend Work:**
- Update `analytics.tsx` and `enhanced-reports-analytics.tsx`

**Implementation Steps:**
1. Create `analytics-service.ts`
2. Fetch from all 3 endpoints
3. Transform data for Recharts format
4. Update chart components with real data
5. Add date range selector

**Acceptance Criteria:**
- [ ] Charts show real data
- [ ] Can change date range
- [ ] Loading states work
- [ ] Error handling in place

---

## 8.4 Engineer 3: Admin & User Management

### Task 3.1: User Management CRUD
**Priority:** P0 - High
**Estimate:** 6-8 hours

**Goal:** Wire User Management to real API

**Backend (Available):**
- `GET /api/admin/users` - List
- `POST /api/admin/users` - Create
- `PATCH /api/admin/users/{id}` - Update
- `DELETE /api/admin/users/{id}` - Delete

**Frontend Work:**
- Update `admin-settings.tsx` User Management tab

**Implementation Steps:**
1. Create `admin-service.ts`:
   ```typescript
   export const getUsers = async () => {...}
   export const createUser = async (data) => {...}
   export const updateUser = async (id, data) => {...}
   export const deleteUser = async (id) => {...}
   ```
2. Replace mock `users` array with API fetch
3. Wire Create button to API
4. Wire Edit button to update API
5. Wire Delete with confirmation
6. Add search with API params
7. Add loading and error states

**Acceptance Criteria:**
- [ ] User list loads from API
- [ ] Can create new user
- [ ] Can edit existing user
- [ ] Can deactivate user
- [ ] Search works

---

### Task 3.2: Admin Settings Tabs
**Priority:** P2 - Low
**Estimate:** 4-5 hours

**Goal:** Implement other admin settings tabs

**Tabs to Complete:**
1. AI Settings - Display current AI model config
2. Security Settings - Display security policies
3. System Settings - Display system info

**Implementation Steps:**
1. Create forms for each tab
2. Fetch current settings from API
3. Add save functionality
4. Show success/error messages

**Acceptance Criteria:**
- [ ] Each tab shows current settings
- [ ] Can modify settings (where applicable)
- [ ] Changes persist

---

## 8.5 Engineer 4: Claims & Submissions

### Task 4.1: Claims Inbox Testing & Wiring
**Priority:** P0 - High
**Estimate:** 5-6 hours

**Goal:** Verify and complete claims inbox functionality

**Backend (Available):**
- `GET /api/claims/encounters`

**Frontend Work:**
- Update `claims-inbox.tsx`

**Implementation Steps:**
1. Replace mock `mockClaims` with API call
2. Add proper error handling
3. Test all functionality:
   - List loads correctly
   - Pagination works
   - Status filtering works
   - Search works
   - Click opens detail
4. Document any bugs found
5. Fix bugs

**Testing Checklist:**
- [ ] Claims load from API
- [ ] Can filter by status
- [ ] Can search by patient name
- [ ] Pagination works
- [ ] Detail view opens
- [ ] No console errors

---

### Task 4.2: Submissions/Acknowledgments Page
**Priority:** P1 - Medium
**Estimate:** 6-8 hours

**Goal:** Make submissions page dynamic

**Backend Work (May Need):**
- Check if `GET /api/claims/submissions` exists
- Create if needed

**Frontend Work:**
- Update `enhanced-submissions-acks.tsx`

**Implementation Steps:**
1. Identify/create backend endpoint
2. Create `claims-service.ts`
3. Replace mock data arrays
4. Test CH rejections tab
5. Test Payer rejections tab

**Acceptance Criteria:**
- [ ] Submissions load from API
- [ ] CH rejections display correctly
- [ ] Payer rejections display correctly
- [ ] Filtering works

---

# 9. DETAILED IMPLEMENTATION GUIDES

## 9.1 Creating a Service File

```typescript
// Frontend/src/services/security-service.ts

// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get auth header
const getAuthHeader = (): Record<string, string> => {
  // Check both storage locations (remember me uses localStorage)
  const token = localStorage.getItem('access_token') ||
                sessionStorage.getItem('access_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API error' }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
};

// Fetch security dashboard
export const getSecurityDashboard = async (range: '1h' | '24h' | '7d' | '30d' = '24h') => {
  const response = await fetch(
    `${API_BASE_URL}/api/security/dashboard?range=${range}`,
    { headers: getAuthHeader() }
  );
  return handleApiError(response);
};

// Fetch login attempts with pagination
export const getLoginAttempts = async (page: number = 1, limit: number = 20) => {
  const response = await fetch(
    `${API_BASE_URL}/api/security/login-attempts?page=${page}&limit=${limit}`,
    { headers: getAuthHeader() }
  );
  return handleApiError(response);
};

// Fetch security events
export const getSecurityEvents = async (
  page: number = 1,
  limit: number = 20,
  severity?: string
) => {
  let url = `${API_BASE_URL}/api/security/events?page=${page}&limit=${limit}`;
  if (severity) url += `&severity=${severity}`;

  const response = await fetch(url, { headers: getAuthHeader() });
  return handleApiError(response);
};

// Resolve a security event
export const resolveSecurityEvent = async (eventId: string, notes: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/security/events/${eventId}/resolve`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resolution_notes: notes })
    }
  );
  return handleApiError(response);
};
```

## 9.2 Creating a Data Table Component

```typescript
// Frontend/src/components/security/login-attempts-table.tsx

import { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLoginAttempts } from '../../services/security-service';

interface LoginAttempt {
  attempt_id: string;
  username: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string;
  user_agent: string;
  country: string;
  city: string;
  attempted_at: string;
}

interface PaginatedResponse {
  items: LoginAttempt[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function LoginAttemptsTable() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLoginAttempts(page, 20);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const maskIP = (ip: string) => {
    // Show first part, mask the rest
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return ip.substring(0, 8) + '...';
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        {error}
        <Button variant="outline" size="sm" className="ml-4" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.No</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((attempt, index) => (
              <TableRow key={attempt.attempt_id}>
                <TableCell>{(page - 1) * 20 + index + 1}</TableCell>
                <TableCell>{formatDate(attempt.attempted_at)}</TableCell>
                <TableCell className="font-medium">{attempt.username}</TableCell>
                <TableCell>
                  <Badge variant={attempt.success ? 'default' : 'destructive'}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {maskIP(attempt.ip_address)}
                </TableCell>
                <TableCell>{getBrowserName(attempt.user_agent)}</TableCell>
                <TableCell>
                  {attempt.city && attempt.country
                    ? `${attempt.city}, ${attempt.country}`
                    : 'Unknown'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {attempt.failure_reason || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.pages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 9.3 Creating a Backend Endpoint

```python
# Backend/medical_coding_ai/api/admin.py

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime, timedelta

from ..models.user_models import AuditLog, User
from .deps import get_db, get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get('/audit-logs')
async def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get paginated audit logs with optional filtering.

    Only accessible by admin users.
    """
    # Build base query
    query = select(AuditLog).order_by(desc(AuditLog.created_at))
    count_query = select(func.count(AuditLog.log_id))

    # Apply filters
    if action_type:
        query = query.where(AuditLog.action_type == action_type)
        count_query = count_query.where(AuditLog.action_type == action_type)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        count_query = count_query.where(AuditLog.user_id == user_id)

    if start_date:
        query = query.where(AuditLog.created_at >= start_date)
        count_query = count_query.where(AuditLog.created_at >= start_date)

    if end_date:
        query = query.where(AuditLog.created_at <= end_date)
        count_query = count_query.where(AuditLog.created_at <= end_date)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()

    # Get user names for display
    user_ids = [log.user_id for log in logs if log.user_id]
    user_names = {}

    if user_ids:
        users_result = await db.execute(
            select(User).where(User.user_id.in_(user_ids))
        )
        users = users_result.scalars().all()
        user_names = {str(u.user_id): u.username for u in users}

    return {
        "items": [
            {
                "log_id": str(log.log_id),
                "user_id": str(log.user_id) if log.user_id else None,
                "username": user_names.get(str(log.user_id), "System"),
                "action_type": log.action_type,
                "action_category": log.action_category,
                "entity_type": log.entity_type,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "api_endpoint": log.api_endpoint,
                "http_method": log.http_method,
                "status": log.status,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 0
    }
```

---

# 10. TESTING PROCEDURES

## 10.1 Testing Checklist by Feature

### Login Attempts Display
- [ ] API returns data successfully
- [ ] Table renders with correct columns
- [ ] Pagination controls work
- [ ] Success/failure badges show correctly
- [ ] IP addresses are masked
- [ ] Timestamps are formatted

### Security Alerts Dashboard
- [ ] API call succeeds
- [ ] Counts display correctly
- [ ] Loading state shows
- [ ] Error state handles gracefully

### User Management
- [ ] User list loads
- [ ] Create user works
- [ ] Edit user works
- [ ] Delete user works (soft delete)
- [ ] Search filters results
- [ ] Role filter works

### Claims Inbox
- [ ] Claims load from API
- [ ] Pagination works
- [ ] Status filter works
- [ ] Search works
- [ ] Click opens detail view

## 10.2 Browser Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

## 10.3 Console Error Check

After each feature:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for:
   - Red errors
   - Yellow warnings (non-critical)
   - Network failures in Network tab

---

# 11. MILESTONES & DELIVERABLES

## 11.1 Daily Milestones

| Day | Milestone | Deliverables |
|-----|-----------|--------------|
| **Day 1** | Environment Setup | All engineers running app locally |
| **Day 2** | API Integration Started | At least 1 service file per engineer |
| **Day 3** | Core Features Working | Login tracking, User management connected |
| **Day 4** | Dashboard Dynamic | Dashboard shows real data |
| **Day 5** | All Features Connected | All assigned tasks completed |
| **Day 6** | Testing Complete | No critical bugs, all tests pass |
| **Day 7** | Documentation & Review | PRs ready for review |

## 11.2 Acceptance Criteria

### P0 - Must Have (Before Sprint End)
- [ ] Login attempts visible in Admin Settings
- [ ] Security alerts show real counts on dashboard
- [ ] User management CRUD works completely
- [ ] Dashboard statistics are from real data
- [ ] No JavaScript errors in console

### P1 - Should Have
- [ ] Pagination on all data tables
- [ ] Loading states on all API calls
- [ ] Error handling with user-friendly messages
- [ ] Analytics charts with real data

### P2 - Nice to Have
- [ ] Export to CSV functionality
- [ ] Advanced filtering options
- [ ] Real-time updates

---

# 12. QUICK REFERENCE

## 12.1 Key Files

| Purpose | Path |
|---------|------|
| Backend entry | `Backend/main.py` |
| Auth API | `Backend/medical_coding_ai/api/auth.py` |
| Admin API | `Backend/medical_coding_ai/api/admin.py` |
| Security API | `Backend/medical_coding_ai/api/security_monitoring.py` |
| User model | `Backend/medical_coding_ai/models/user_models.py` |
| Frontend entry | `Frontend/src/App.tsx` |
| Auth context | `Frontend/src/contexts/auth-context.tsx` |
| Auth service | `Frontend/src/services/auth-service.ts` |
| Dashboard | `Frontend/src/components/role-dashboards/` |
| Admin settings | `Frontend/src/components/admin-settings.tsx` |

## 12.2 Commands

```bash
# Start Backend
cd Backend
python -m uvicorn main:app --reload --port 8000

# Start Frontend
cd Frontend
npm run dev

# Initialize Database
cd Backend
python init_db.py
python scripts/initialization/seed_admin.py

# Check API Health
curl http://localhost:8000/health
```

## 12.3 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin123 |
| Coder | coder1 | Coder123 |

## 12.4 URLs

| Purpose | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

**END OF DOCUMENT**

---

*Document created for Panaceon V-06 Sprint 1 Team Onboarding*
*Last updated: January 13, 2026*
