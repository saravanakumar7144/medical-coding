// Authentication types for the Medical Coding AI Platform

export type UserRole = 'coder' | 'billing' | 'manager' | 'executive' | 'auditor' | 'admin';

export interface Permission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'export')[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  activeRole?: UserRole;
  permissions: Permission[];
  organizationId: string;
  organizationName: string;
  avatar?: string;
  lastLogin?: string;
  mfaEnabled: boolean;
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  termsVersion?: string;
  privacyPolicyVersion?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  organizationId: string;
  role: UserRole;
}

export interface TenantRegistrationData {
  companyName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  planTier: 'standard' | 'premium' | 'enterprise';
}

export interface SSOProvider {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerification {
  code: string;
  trustDevice?: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SessionInfo {
  id: string;
  deviceName: string;
  location: string;
  lastActive: string;
  current: boolean;
}

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  coder: [
    { module: 'Chart Coding', actions: ['view', 'create', 'edit'] },
    { module: 'Code Library', actions: ['view'] },
    { module: 'Claims Inbox', actions: ['view'] },
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Batch Processing', actions: ['view', 'create'] },
    { module: 'Code Sets & Updates', actions: ['view'] },
  ],
  billing: [
    { module: 'Claims Inbox', actions: ['view', 'create', 'edit', 'export'] },
    { module: 'Submissions & Acks', actions: ['view', 'create', 'edit'] },
    { module: 'ERAs & Payments', actions: ['view', 'create', 'edit'] },
    { module: 'AI Denials Workbench', actions: ['view', 'create', 'edit'] },
    { module: 'Patient Billing', actions: ['view', 'create', 'edit'] },
    { module: 'Payers & Fee Schedules', actions: ['view'] },
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Reports & Analytics', actions: ['view', 'export'] },
  ],
  manager: [
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Reports & Analytics', actions: ['view', 'export'] },
    { module: 'Claims Inbox', actions: ['view', 'export'] },
    { module: 'Analytics', actions: ['view', 'export'] },
    { module: 'Chart Coding', actions: ['view'] },
    { module: 'Batch Processing', actions: ['view'] },
    { module: 'AI Denials Workbench', actions: ['view'] },
    { module: 'ERAs & Payments', actions: ['view'] },
    { module: 'Submissions & Acks', actions: ['view'] },
  ],
  executive: [
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Reports & Analytics', actions: ['view', 'export'] },
    { module: 'Analytics', actions: ['view', 'export'] },
    { module: 'Claims Inbox', actions: ['view'] },
  ],
  auditor: [
    { module: 'Chart Coding', actions: ['view'] },
    { module: 'Claims Inbox', actions: ['view', 'export'] },
    { module: 'Reports & Analytics', actions: ['view', 'export'] },
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Analytics', actions: ['view'] },
    { module: 'Code Library', actions: ['view'] },
    { module: 'Batch Processing', actions: ['view'] },
  ],
  admin: [
    { module: 'Admin & Settings', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'Dashboard', actions: ['view'] },
    { module: 'Reports & Analytics', actions: ['view', 'export'] },
    { module: 'Analytics', actions: ['view', 'export'] },
    { module: 'Claims Inbox', actions: ['view'] },
    { module: 'Payers & Fee Schedules', actions: ['view', 'create', 'edit', 'delete'] },
    { module: 'Code Sets & Updates', actions: ['view', 'create', 'edit'] },
    { module: 'Rules & Scrubbing', actions: ['view', 'create', 'edit', 'delete'] },
  ],
};

// Module access by role
export const MODULE_ACCESS: Record<string, UserRole[]> = {
  'Home': ['coder', 'billing', 'manager', 'executive', 'auditor', 'admin'],
  'Dashboard': ['coder', 'billing', 'manager', 'executive', 'auditor', 'admin'],
  'Claims Inbox': ['coder', 'billing', 'manager', 'executive', 'auditor', 'admin'],
  'Chart Coding': ['coder', 'auditor'],
  'Batch Processing': ['coder', 'manager', 'auditor'],
  'Code Library': ['coder', 'auditor'],
  'Eligibility & Auth': ['billing', 'admin'],
  'Submissions & Acks': ['billing', 'manager'],
  'ERAs & Payments': ['billing', 'manager'],
  'AI Denials Workbench': ['billing', 'manager'],
  'Appeals & Recons': ['billing'],
  'Patient Billing': ['billing'],
  'Payers & Fee Schedules': ['billing', 'admin'],
  'Code Sets & Updates': ['coder', 'admin'],
  'Rules & Scrubbing': ['admin'],
  'Reports & Analytics': ['billing', 'manager', 'executive', 'auditor', 'admin'],
  'Analytics': ['manager', 'executive', 'auditor', 'admin'],
  'Admin & Settings': ['admin'],
  'Enhanced Claim Workspace': ['billing', 'admin'],
  'Enhanced Payers Portal': ['billing', 'admin'],
  'Real-Time Claim Status': ['billing', 'manager'],
  'Enhanced Prior Auth': ['billing'],
  'Central Unit Calculator': ['coder', 'billing'],
};
