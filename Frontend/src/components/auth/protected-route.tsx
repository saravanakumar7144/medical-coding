import { ReactNode } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { MODULE_ACCESS, UserRole } from '../../types/auth';
import { AlertCircle, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: UserRole | UserRole[];
  requireModule?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireRole, 
  requireModule,
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#62d5e4] mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access this page.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#62d5e4] hover:bg-[#52c5d4]"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Role-based access check
  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    const hasRole = user.activeRole && roles.includes(user.activeRole);

    if (!hasRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                Your current role ({user.activeRole}) does not have permission to access this resource.
                {user.roles.length > 1 && (
                  <span className="block mt-2">
                    You can switch to a different role from your profile menu.
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      );
    }
  }

  // Module-based access check
  if (requireModule) {
    const allowedRoles = MODULE_ACCESS[requireModule];
    const hasAccess = user.activeRole && allowedRoles?.includes(user.activeRole);

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Module Access Denied</AlertTitle>
              <AlertDescription>
                Your current role ({user.activeRole}) does not have permission to access "{requireModule}".
                {user.roles.length > 1 && allowedRoles && (
                  <span className="block mt-2">
                    This module requires one of the following roles: {allowedRoles.join(', ')}.
                  </span>
                )}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      );
    }
  }

  // All checks passed
  return <>{children}</>;
}
