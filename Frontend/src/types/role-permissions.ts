// Role-based access control (RBAC) configuration
// Defines which pages/features each role can access

import { UserRole } from './auth';

export type PageId = 
  // Dashboard & Home
  | 'Home'
  | 'Dashboard'
  
  // Claims Management
  | 'Claims Inbox'
  | 'Submissions & Acks'
  | 'Enhanced Claim Workspace'
  | 'Real-Time Claim Status'
  
  // Payments & Revenue
  | 'ERAs & Payments'
  | 'AI Denials Workbench'
  | 'Appeals & Recons'
  | 'Patient Billing'
  
  // Patient & Eligibility
  | 'Eligibility & Auth'
  
  // Payers & Contracts
  | 'Payers & Fee Schedules'
  | 'Enhanced Payers Portal'
  
  // Coding & Documentation
  | 'Chart Coding'
  | 'Code Library'
  | 'Code Sets & Updates'
  | 'Batch Processing'
  
  // Analytics & Reporting
  | 'Reports & Analytics'
  | 'Analytics'
  
  // Configuration
  | 'Rules & Scrubbing'
  | 'Admin & Settings'
  
  // Enhanced Features
  | 'Enhanced Prior Auth'
  | 'Central Unit Calculator'
  
  // Testing
  | 'Auth Testing';

export interface RoleAccessConfig {
  role: UserRole;
  displayName: string;
  description: string;
  allowedPages: PageId[];
  defaultPage: PageId;
}

// Define access control for each role
export const ROLE_ACCESS: Record<UserRole, RoleAccessConfig> = {
  coder: {
    role: 'coder',
    displayName: 'Medical Coder',
    description: 'Code charts and review documentation',
    defaultPage: 'Home',
    allowedPages: [
      'Home',
      'Dashboard',
      'Chart Coding',
      'Code Library',
      'Code Sets & Updates',
      'Batch Processing',
      'Enhanced Claim Workspace',
      'Eligibility & Auth',
      'Central Unit Calculator',
      'Auth Testing', // For development
    ],
  },
  
  billing: {
    role: 'billing',
    displayName: 'Billing Specialist',
    description: 'Process claims and manage revenue',
    defaultPage: 'Home',
    allowedPages: [
      'Home',
      'Dashboard',
      'Claims Inbox',
      'Submissions & Acks',
      'Enhanced Claim Workspace',
      'Real-Time Claim Status',
      'ERAs & Payments',
      'AI Denials Workbench',
      'Appeals & Recons',
      'Patient Billing',
      'Eligibility & Auth',
      'Payers & Fee Schedules',
      'Enhanced Payers Portal',
      'Enhanced Prior Auth',
      'Reports & Analytics',
      'Auth Testing', // For development
    ],
  },
  
  manager: {
    role: 'manager',
    displayName: 'Manager',
    description: 'Oversee team and performance',
    defaultPage: 'Home',
    allowedPages: [
      'Home',
      'Dashboard',
      'Claims Inbox',
      'Submissions & Acks',
      'ERAs & Payments',
      'AI Denials Workbench',
      'Appeals & Recons',
      'Reports & Analytics',
      'Analytics',
      'Payers & Fee Schedules',
      'Rules & Scrubbing',
      'Auth Testing', // For development
    ],
  },
  
  executive: {
    role: 'executive',
    displayName: 'Executive',
    description: 'Strategic oversight and KPIs',
    defaultPage: 'Home',
    allowedPages: [
      'Home',
      'Dashboard',
      'Reports & Analytics',
      'Analytics',
      'AI Denials Workbench',
      'ERAs & Payments',
      'Payers & Fee Schedules',
      'Auth Testing', // For development
    ],
  },
  
  auditor: {
    role: 'auditor',
    displayName: 'Auditor',
    description: 'Review compliance and quality',
    defaultPage: 'Home',
    allowedPages: [
      'Home',
      'Dashboard',
      'Chart Coding',
      'Code Library',
      'Enhanced Claim Workspace',
      'Claims Inbox',
      'Submissions & Acks',
      'AI Denials Workbench',
      'Reports & Analytics',
      'Analytics',
      'Rules & Scrubbing',
      'Auth Testing', // For development
    ],
  },
  
  admin: {
    role: 'admin',
    displayName: 'Administrator',
    description: 'System configuration and user management',
    defaultPage: 'Admin & Settings',
    allowedPages: [
      'Home',
      'Dashboard',
      'Admin & Settings',
      'Rules & Scrubbing',
      'Payers & Fee Schedules',
      'Code Sets & Updates',
      'Reports & Analytics',
      'Auth Testing', // For development
      // Admin has access to most pages for configuration
      'Claims Inbox',
      'Chart Coding',
      'Code Library',
      'Enhanced Claim Workspace',
      'ERAs & Payments',
      'AI Denials Workbench',
      'Eligibility & Auth',
      'Enhanced Payers Portal',
    ],
  },
};

// Helper function to check if a user role has access to a page
export function hasPageAccess(role: UserRole, pageId: PageId): boolean {
  const roleConfig = ROLE_ACCESS[role];
  return roleConfig.allowedPages.includes(pageId);
}

// Helper function to get allowed pages for a role
export function getAllowedPages(role: UserRole): PageId[] {
  return ROLE_ACCESS[role].allowedPages;
}

// Helper function to get default page for a role
export function getDefaultPage(role: UserRole): PageId {
  return ROLE_ACCESS[role].defaultPage;
}

// Helper function to filter navigation items based on role
export function filterNavigationByRole<T extends { name: string }>(
  items: T[],
  role: UserRole
): T[] {
  const allowedPages = getAllowedPages(role);
  return items.filter(item => allowedPages.includes(item.name as PageId));
}
