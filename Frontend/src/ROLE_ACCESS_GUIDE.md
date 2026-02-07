# Role-Based Access Control (RBAC) Guide

## Overview
The Medical Coding AI Platform implements comprehensive role-based access control. Each role has access to specific features tailored to their responsibilities.

## Login Credentials

### Test Accounts
Use these credentials to test different roles:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Medical Coder** | coder@medcoding.com | Coder123! | Chart coding and documentation |
| **Billing Specialist** | billing@medcoding.com | Billing123! | Claims processing and revenue management |
| **Manager** | manager@medcoding.com | Manager123! | Team oversight and performance tracking |
| **Executive** | executive@medcoding.com | Executive123! | Strategic KPIs and analytics |
| **Auditor** | auditor@medcoding.com | Auditor123! | Quality assurance and compliance |
| **Administrator** | admin@medcoding.com | Admin123! | System configuration and user management |
| **Multi-Role User** | multi@medcoding.com | Multi123! | Access to Coder, Billing, and Manager roles |

---

## Role Access Matrix

### 🩺 Medical Coder
**Focus:** Code charts and review documentation

**Dashboard:** Enhanced Coder Dashboard
- Productivity metrics
- Coding queue
- AI coding suggestions
- Recent charts

**Accessible Features:**
- ✅ Chart Coding
- ✅ Code Library
- ✅ Code Sets & Updates
- ✅ Batch Processing
- ✅ Enhanced Claim Workspace
- ✅ Eligibility & Auth
- ✅ Central Unit Calculator

**Typical Workflow:**
1. Review charts in coding queue
2. Use AI suggestions for accurate coding
3. Look up codes in code library
4. Verify eligibility and authorization
5. Submit coded charts

---

### 💰 Billing Specialist
**Focus:** Process claims and manage revenue

**Dashboard:** Enhanced Biller Dashboard
- Claims metrics
- Denial trends
- Payment tracking
- Revenue analytics

**Accessible Features:**
- ✅ Claims Inbox
- ✅ Submissions & Acknowledgments
- ✅ Enhanced Claim Workspace
- ✅ Real-Time Claim Status
- ✅ ERAs & Payments
- ✅ AI Denials Workbench
- ✅ Appeals & Reconsiderations
- ✅ Patient Billing
- ✅ Eligibility & Auth
- ✅ Payers & Fee Schedules
- ✅ Enhanced Payers Portal
- ✅ Enhanced Prior Auth
- ✅ Reports & Analytics

**Typical Workflow:**
1. Monitor claims inbox for issues
2. Process ERA payments
3. Work denials workbench
4. Submit appeals
5. Generate patient statements
6. Track revenue metrics

---

### 👥 Manager
**Focus:** Oversee team and performance

**Dashboard:** Enhanced Manager Dashboard
- Team productivity
- Quality metrics
- Workflow efficiency
- Performance trends

**Accessible Features:**
- ✅ Claims Inbox
- ✅ Submissions & Acknowledgments
- ✅ ERAs & Payments
- ✅ AI Denials Workbench
- ✅ Appeals & Reconsiderations
- ✅ Reports & Analytics
- ✅ Analytics
- ✅ Payers & Fee Schedules
- ✅ Rules & Scrubbing

**Typical Workflow:**
1. Review team performance metrics
2. Monitor workflow efficiency
3. Analyze denial patterns
4. Generate performance reports
5. Configure scrubbing rules
6. Track payer performance

---

### 🏢 Executive
**Focus:** Strategic oversight and KPIs

**Dashboard:** Enhanced Executive Dashboard
- Financial performance
- Strategic KPIs
- Revenue trends
- Department analytics

**Accessible Features:**
- ✅ Reports & Analytics
- ✅ Analytics
- ✅ AI Denials Workbench
- ✅ ERAs & Payments
- ✅ Payers & Fee Schedules

**Typical Workflow:**
1. Review financial dashboards
2. Analyze revenue trends
3. Monitor denial impact
4. Evaluate payer relationships
5. Make strategic decisions

---

### 🛡️ Auditor
**Focus:** Review compliance and quality

**Dashboard:** Enhanced Auditor Dashboard
- Audit queue
- Coding accuracy rates
- Compliance issues
- Coder performance

**Accessible Features:**
- ✅ Chart Coding
- ✅ Code Library
- ✅ Enhanced Claim Workspace
- ✅ Claims Inbox
- ✅ Submissions & Acknowledgments
- ✅ AI Denials Workbench
- ✅ Reports & Analytics
- ✅ Analytics
- ✅ Rules & Scrubbing

**Typical Workflow:**
1. Review charts in audit queue
2. Assess coding accuracy
3. Identify compliance issues
4. Generate audit reports
5. Track coder performance
6. Recommend improvements

---

### 🎯 Administrator
**Focus:** System configuration and user management

**Dashboard:** Enhanced Admin Dashboard
- User management
- System health
- Pending approvals
- Security alerts

**Accessible Features:**
- ✅ Admin & Settings (Primary)
- ✅ Rules & Scrubbing
- ✅ Payers & Fee Schedules
- ✅ Code Sets & Updates
- ✅ Reports & Analytics
- ✅ All other features (for configuration purposes)

**Typical Workflow:**
1. Manage user accounts
2. Configure system settings
3. Approve pending requests
4. Monitor system health
5. Handle security alerts
6. Update fee schedules

---

## Role Switching

### For Multi-Role Users
Users with multiple roles (like multi@medcoding.com) can:
1. See a role selector in the sidebar
2. Click to open role chooser
3. Select desired role
4. Navigation automatically updates to show role-specific features

### What Happens When You Switch Roles:
- ✅ Sidebar navigation filters to show only allowed features
- ✅ Dashboard changes to role-specific view
- ✅ Default page sets to role's primary focus
- ✅ Unauthorized pages become inaccessible
- ✅ Quick links update contextually

---

## Security Features

### Access Control
- Pages are filtered based on role permissions
- Unauthorized navigation attempts redirect to default page
- Console warnings for access violations (development mode)

### Data Persistence
- User roles and preferences stored securely
- Role changes persist across sessions
- Multi-role selections remembered

### Authentication
- Secure login with password validation
- Token-based session management
- Auto token refresh before expiry
- Secure logout clears all session data

---

## Feature Comparison

| Feature | Coder | Billing | Manager | Executive | Auditor | Admin |
|---------|:-----:|:-------:|:-------:|:---------:|:-------:|:-----:|
| Chart Coding | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Claims Inbox | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| ERAs & Payments | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Denials Workbench | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patient Billing | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reports & Analytics | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Library | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Admin Settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Rules & Scrubbing | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

---

## Getting Started

### For New Users:
1. **Sign up** with your email and create a password
2. **Select your role** during registration
3. **Log in** and you'll see your role-specific dashboard
4. **Navigate** using the filtered sidebar menu

### For Existing Users:
1. **Log in** with your credentials
2. If you have multiple roles, **choose** your active role
3. **Switch roles** anytime via the sidebar role selector
4. **Access** only the features relevant to your current role

---

## Support

For role access questions or permission issues:
- Contact your system administrator
- Check the role access matrix above
- Review the Guidelines.md for detailed feature documentation

---

**Last Updated:** November 2024
**Platform Version:** v2.0 - Enhanced RBAC
