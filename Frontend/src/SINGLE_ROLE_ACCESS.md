# Single Role Access System

## Overview
The Medical Coding AI Platform now implements a **strict single-role access system** where each user is assigned exactly ONE role during signup and can only access features specific to that role.

## How It Works

### 1. Signup Process
- When a user signs up, they select **one role** from the available options:
  - Medical Coder
  - Billing Specialist
  - Manager
  - Executive
  - Auditor
  - Administrator

- The system assigns ONLY the selected role to the user's account
- Users cannot switch to other roles after signup
- The role selection includes a clear message: "You will only have access to features for the selected role"

### 2. Login Experience
- Users with a single role are automatically logged into their assigned role
- No role chooser screen is shown (this only appears for multi-role users)
- The sidebar displays only navigation items accessible to their role

### 3. Sidebar Role Display
- For single-role users, the role selector shows as a **static badge** (not a dropdown)
- Label shows "Current Role" instead of "Role"
- No chevron icon - users cannot change roles
- Displays the role name and icon clearly

### 4. Navigation Filtering
- The sidebar automatically filters navigation items based on the user's role
- Only pages/features accessible to their role are shown
- Hidden features are completely removed from view (not just disabled)

## Role-Specific Access

### Medical Coder
- Home Dashboard
- Chart Coding
- Code Library
- Code Sets & Updates
- Batch Processing
- Enhanced Claim Workspace
- Eligibility & Auth
- Central Unit Calculator

### Billing Specialist
- Home Dashboard
- Claims Inbox
- Submissions & Acks
- Enhanced Claim Workspace
- Real-Time Claim Status
- ERAs & Payments
- AI Denials Workbench
- Appeals & Recons
- Patient Billing
- Eligibility & Auth
- Payers & Fee Schedules
- Enhanced Payers Portal
- Enhanced Prior Auth
- Reports & Analytics

### Manager
- Home Dashboard
- Claims Inbox
- Submissions & Acks
- ERAs & Payments
- AI Denials Workbench
- Appeals & Recons
- Reports & Analytics
- Analytics
- Payers & Fee Schedules
- Rules & Scrubbing

### Executive
- Home Dashboard
- Reports & Analytics
- Analytics
- AI Denials Workbench
- ERAs & Payments
- Payers & Fee Schedules

### Auditor
- Home Dashboard
- Chart Coding (audit view)
- Batch Processing (audit view)
- Enhanced Claim Workspace (review mode)
- Reports & Analytics
- Analytics
- Rules & Scrubbing

### Administrator
- Home Dashboard
- Admin & Settings
- Reports & Analytics
- Rules & Scrubbing
- All configuration pages

## Testing

### Test Accounts (Single Role)
Each test account has only one role assigned:

- **Coder**: `coder@medcoding.com` / `Coder123!`
- **Billing**: `billing@medcoding.com` / `Billing123!`
- **Manager**: `manager@medcoding.com` / `Manager123!`
- **Executive**: `executive@medcoding.com` / `Executive123!`
- **Auditor**: `auditor@medcoding.com` / `Auditor123!`
- **Admin**: `admin@medcoding.com` / `Admin123!`

### Multi-Role Test Account (For Development Only)
- **Multi**: `multi@medcoding.com` / `Multi123!`
  - Has access to: Coder, Billing, Manager roles
  - Shows role chooser on login
  - Can switch between roles from sidebar

## Technical Implementation

### Signup Flow
```typescript
// User signs up with a single role
const newUser: User = {
  roles: [data.role], // Single role only
  activeRole: data.role,
  permissions: ROLE_PERMISSIONS[data.role],
  // ... other fields
};
```

### Role Selector Logic
```typescript
// Hides role switcher for single-role users
if (roles.length <= 1) {
  return <StaticRoleBadge />; // Non-interactive display
}

// Shows role switcher only for multi-role users
return <RoleDropdown />;
```

### Navigation Filtering
```typescript
// Filters navigation based on active role
const navigationGroups = allNavigationGroups
  .map(group => ({
    ...group,
    items: filterNavigationByRole(group.items, currentRole)
  }))
  .filter(group => group.items.length > 0);
```

## Benefits

1. **Clarity**: Users see only what's relevant to their job function
2. **Simplicity**: No confusion about which features they can access
3. **Security**: Role-based access control prevents unauthorized feature access
4. **Focus**: Users can focus on their specific workflows without distraction
5. **Compliance**: Clear audit trail of who has access to what features

## Future Enhancements

- Admin ability to assign additional roles to existing users
- Role request workflow (user requests additional role, admin approves)
- Temporary role access (time-limited role assignments)
- Role inheritance (certain roles automatically include others)

## Migration Notes

If you need to test multi-role functionality:
1. Use the `multi@medcoding.com` test account
2. Or manually edit localStorage to add roles to an existing user (for development only)

For production deployments:
- Ensure all new signups follow the single-role pattern
- Existing multi-role users will continue to see the role chooser
- Admins can manually adjust user roles through the admin panel (when implemented)
