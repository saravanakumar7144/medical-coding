import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  AuthState, 
  AuthToken, 
  LoginCredentials, 
  SignupData,
  UserRole,
  ROLE_PERMISSIONS,
} from '../types/auth';
import * as authService from '../services/auth-service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  changeRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'remember_me';

// Helper functions for token storage
const getTokenStorage = () => {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

const saveTokens = (tokens: AuthToken, rememberMe: boolean) => {
  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
};

const getStoredTokens = (): AuthToken | null => {
  const storage = getTokenStorage();
  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);

  if (accessToken) {
    return {
      accessToken,
      refreshToken: refreshToken || undefined,
    };
  }
  return null;
};

const clearStoredTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from stored token
  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = getStoredTokens();

      if (storedTokens?.accessToken) {
        try {
          const user = await authService.verifyToken(storedTokens.accessToken);
          setAuthState({
            user,
            tokens: storedTokens,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token invalid, clear storage
          clearStoredTokens();
          setAuthState({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!authState.tokens) return;

    const decoded = authService.decodeToken(authState.tokens.accessToken);
    if (!decoded) return;

    const timeUntilExpiry = decoded.exp - Date.now();
    const refreshTime = timeUntilExpiry - 300000; // Refresh 5 minutes before expiry

    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          await logout();
        }
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [authState.tokens]);

  const login = async (credentials: LoginCredentials, rememberMe: boolean = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user, tokens } = await authService.login(credentials);

      // Save tokens based on remember me preference
      saveTokens(tokens, rememberMe);

      setAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Login failed',
      });
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user, tokens } = await authService.signup(data);

      // Save tokens (don't remember signup sessions by default)
      saveTokens(tokens, false);

      setAuthState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Signup failed',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearStoredTokens();
      setAuthState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const refreshToken = async () => {
    if (!authState.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const newTokens = await authService.refreshToken(authState.tokens.refreshToken);

      // Re-save tokens with same remember me preference
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      saveTokens(newTokens, rememberMe);

      const user = await authService.verifyToken(newTokens.accessToken);

      setAuthState({
        user,
        tokens: newTokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      await logout();
      throw error;
    }
  };

  const changeRole = async (role: UserRole) => {
    if (!authState.user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await authService.changeActiveRole(authState.user.id, role);
      updatedUser.permissions = ROLE_PERMISSIONS[role];

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        refreshToken,
        changeRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}