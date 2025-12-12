'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { usePermissions, Role, Permission, ROLE_DISPLAY_NAMES } from '@/lib/auth/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Role-based access
  requiredRole?: Role;
  allowedRoles?: Role[];
  atLeastRole?: Role;
  
  // Permission-based access
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  
  // Custom unauthorized view
  unauthorizedView?: React.ReactNode;
  
  // Redirect instead of showing unauthorized
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
  atLeastRole,
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
  unauthorizedView,
  redirectTo,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();
  const { hasRole, hasAnyRole, isAtLeast, hasPermission, hasAnyPermission, hasAllPermissions, role } = usePermissions();

  // Check if user has access
  const checkAccess = (): boolean => {
    if (!isAuthenticated) return false;
    
    // Check role-based access
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (allowedRoles && !hasAnyRole(...allowedRoles)) return false;
    if (atLeastRole && !isAtLeast(atLeastRole)) return false;
    
    // Check permission-based access
    if (requiredPermission && !hasPermission(requiredPermission)) return false;
    if (requiredPermissions) {
      if (requireAllPermissions && !hasAllPermissions(...requiredPermissions)) return false;
      if (!requireAllPermissions && !hasAnyPermission(...requiredPermissions)) return false;
    }
    
    return true;
  };

  const hasAccess = checkAccess();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    
    if (!isLoading && isAuthenticated && !hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, hasAccess, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated but no access
  if (!hasAccess) {
    if (unauthorizedView) {
      return <>{unauthorizedView}</>;
    }
    
    if (redirectTo) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting...</p>
          </div>
        </div>
      );
    }

    // Default unauthorized view
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="bg-card rounded-xl border p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view this page.
          </p>
          <div className="text-sm text-muted-foreground mb-6 p-3 bg-muted rounded-lg">
            <p>Your role: <span className="font-medium">{role ? ROLE_DISPLAY_NAMES[role] : 'Unknown'}</span></p>
            {requiredRole && (
              <p className="mt-1">Required: <span className="font-medium">{ROLE_DISPLAY_NAMES[requiredRole]}</span></p>
            )}
            {atLeastRole && (
              <p className="mt-1">Minimum required: <span className="font-medium">{ROLE_DISPLAY_NAMES[atLeastRole]}</span></p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

