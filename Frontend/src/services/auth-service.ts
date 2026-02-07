// Real authentication service calling Backend API

import {
  User,
  AuthToken,
  LoginCredentials,
  SignupData,
  UserRole,
  ROLE_PERMISSIONS,
  PasswordResetRequest,
  PasswordReset,
  MFASetup,
  MFAVerification,
  TenantRegistrationData,
} from '../types/auth';

// Get API URL from environment variable (set in .env as VITE_API_URL)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api/auth`;

// Helper to handle API errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    let errorMessage = error.detail || 'API request failed';

    if (Array.isArray(errorMessage)) {
      // Handle FastAPI validation errors
      errorMessage = errorMessage.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
    } else if (typeof errorMessage === 'object') {
      errorMessage = JSON.stringify(errorMessage);
    }

    throw new Error(errorMessage);
  }
  return response.json();
};

// Login
export const login = async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthToken }> => {
  const response = await fetch(`${API_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: credentials.email,
      password: credentials.password
    }),
  });

  const data = await handleResponse(response);
  const accessToken = data.access_token;

  // Get user details
  const user = await verifyToken(accessToken);

  const tokens: AuthToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '', // Capture refresh token from backend response
    expiresIn: data.expires_in || 3600,
    tokenType: data.token_type || 'Bearer'
  };

  return { user, tokens };
};

// Signup
export const signup = async (data: SignupData): Promise<{ user: User; tokens: AuthToken }> => {
  // First create user
  const signupResponse = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: data.organizationId, // Assuming orgId is tenant_id
      username: data.email,
      email: data.email,
      password: data.password,
      first_name: data.name.split(' ')[0],
      last_name: data.name.split(' ').slice(1).join(' '),
      role: data.role
    }),
  });

  await handleResponse(signupResponse);

  // Then login
  return login({ email: data.email, password: data.password });
};

// Register Tenant
export const registerTenant = async (data: TenantRegistrationData): Promise<{ tenant_id: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/tenants/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: data.companyName,
      admin_email: data.adminEmail,
      admin_password: data.adminPassword,
      admin_first_name: data.adminFirstName,
      admin_last_name: data.adminLastName,
      plan_tier: data.planTier
    }),
  });

  return handleResponse(response);
};

// Logout
export const logout = async (): Promise<void> => {
  // Get token from storage
  const rememberMe = localStorage.getItem('remember_me') === 'true';
  const storage = rememberMe ? localStorage : sessionStorage;
  const token = storage.getItem('access_token');

  if (token) {
    try {
      // Call backend logout endpoint to blacklist token
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      // Don't throw on error - client-side logout is sufficient
      if (!response.ok) {
        console.warn('Server-side logout failed, but client-side logout will proceed');
      }
    } catch (error) {
      // Network error - continue with client-side logout
      console.warn('Failed to contact logout endpoint:', error);
    }
  }

  // Client-side logout always succeeds
  return Promise.resolve();
};

// Refresh token
export const refreshToken = async (token: string): Promise<AuthToken> => {
  const response = await fetch(`${API_URL}/refresh?refresh_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse(response);
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || token, // Use new refresh token if provided, else keep old
    expiresIn: data.expires_in || 3600,
    tokenType: data.token_type || 'Bearer'
  };
};

// Verify token (Get Current User)
export const verifyToken = async (token: string): Promise<User> => {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });

  const userData = await handleResponse(response);

  // Map backend user to frontend User type
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    roles: userData.roles,
    activeRole: userData.activeRole,
    permissions: ROLE_PERMISSIONS[userData.activeRole as UserRole] || [],
    organizationId: userData.organizationId,
    organizationName: 'My Organization', // Placeholder
    mfaEnabled: userData.mfaEnabled,
    lastLogin: new Date().toISOString(),
    termsAccepted: userData.termsAccepted,
    privacyPolicyAccepted: userData.privacyPolicyAccepted,
    termsVersion: userData.termsVersion,
    privacyPolicyVersion: userData.privacyPolicyVersion,
  };
};

// Request password reset
export const requestPasswordReset = async (data: PasswordResetRequest): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// Reset password
export const resetPassword = async (data: PasswordReset): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: data.token,
      user_id: 'TODO', // Frontend needs to pass user_id from URL
      new_password: data.password
    }),
  });
  return handleResponse(response);
};

// Setup MFA
export const setupMFA = async (): Promise<MFASetup> => {
  // TODO: Implement in backend if needed or use existing endpoints
  return {
    secret: '',
    qrCode: '',
    backupCodes: []
  };
};

// Verify MFA
export const verifyMFA = async (data: MFAVerification): Promise<{ valid: boolean }> => {
  // TODO: Implement
  return { valid: true };
};

// Change active role
export const changeActiveRole = async (userId: string, role: UserRole): Promise<User> => {
  // For now just update locally as backend doesn't support multi-role switching yet
  // In real app, call backend
  return Promise.resolve({} as User); // Placeholder
};

// Get current user from token
export const getCurrentUser = async (token: string): Promise<User> => {
  return verifyToken(token);
};

// Decode token helper
export const decodeToken = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};