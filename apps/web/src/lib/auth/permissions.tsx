'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './auth-provider';

// Match backend roles
export enum Role {
  SYSTEM_ADMIN = 'system_admin',
  TENANT_ADMIN = 'tenant_admin',
  HR_ADMIN = 'hr_admin',
  RECRUITER = 'recruiter',
  HIRING_MANAGER = 'hiring_manager',
  INTERVIEWER = 'interviewer',
  VIEWER = 'viewer',
}

// Define all permissions
export enum Permission {
  // Jobs
  JOBS_VIEW = 'jobs:view',
  JOBS_CREATE = 'jobs:create',
  JOBS_EDIT = 'jobs:edit',
  JOBS_DELETE = 'jobs:delete',
  JOBS_PUBLISH = 'jobs:publish',
  
  // Candidates
  CANDIDATES_VIEW = 'candidates:view',
  CANDIDATES_CREATE = 'candidates:create',
  CANDIDATES_EDIT = 'candidates:edit',
  CANDIDATES_DELETE = 'candidates:delete',
  
  // Applications
  APPLICATIONS_VIEW = 'applications:view',
  APPLICATIONS_CREATE = 'applications:create',
  APPLICATIONS_UPDATE_STATUS = 'applications:update_status',
  
  // Resumes
  RESUMES_VIEW = 'resumes:view',
  RESUMES_UPLOAD = 'resumes:upload',
  RESUMES_DELETE = 'resumes:delete',
  
  // Interviews
  INTERVIEWS_VIEW = 'interviews:view',
  INTERVIEWS_SCHEDULE = 'interviews:schedule',
  INTERVIEWS_CONDUCT = 'interviews:conduct',
  INTERVIEWS_SUBMIT_FEEDBACK = 'interviews:submit_feedback',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  
  // Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE_TEAM = 'settings:manage_team',
  SETTINGS_MANAGE_TENANT = 'settings:manage_tenant',
  SETTINGS_BILLING = 'settings:billing',
  
  // Admin
  ADMIN_USERS = 'admin:users',
  ADMIN_TENANTS = 'admin:tenants',
  ADMIN_SYSTEM = 'admin:system',
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SYSTEM_ADMIN]: Object.values(Permission), // All permissions
  
  [Role.TENANT_ADMIN]: [
    // All tenant-level permissions
    Permission.JOBS_VIEW, Permission.JOBS_CREATE, Permission.JOBS_EDIT, Permission.JOBS_DELETE, Permission.JOBS_PUBLISH,
    Permission.CANDIDATES_VIEW, Permission.CANDIDATES_CREATE, Permission.CANDIDATES_EDIT, Permission.CANDIDATES_DELETE,
    Permission.APPLICATIONS_VIEW, Permission.APPLICATIONS_CREATE, Permission.APPLICATIONS_UPDATE_STATUS,
    Permission.RESUMES_VIEW, Permission.RESUMES_UPLOAD, Permission.RESUMES_DELETE,
    Permission.INTERVIEWS_VIEW, Permission.INTERVIEWS_SCHEDULE, Permission.INTERVIEWS_CONDUCT, Permission.INTERVIEWS_SUBMIT_FEEDBACK,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE_TEAM, Permission.SETTINGS_MANAGE_TENANT, Permission.SETTINGS_BILLING,
  ],
  
  [Role.HR_ADMIN]: [
    Permission.JOBS_VIEW, Permission.JOBS_CREATE, Permission.JOBS_EDIT, Permission.JOBS_PUBLISH,
    Permission.CANDIDATES_VIEW, Permission.CANDIDATES_CREATE, Permission.CANDIDATES_EDIT,
    Permission.APPLICATIONS_VIEW, Permission.APPLICATIONS_CREATE, Permission.APPLICATIONS_UPDATE_STATUS,
    Permission.RESUMES_VIEW, Permission.RESUMES_UPLOAD, Permission.RESUMES_DELETE,
    Permission.INTERVIEWS_VIEW, Permission.INTERVIEWS_SCHEDULE, Permission.INTERVIEWS_CONDUCT, Permission.INTERVIEWS_SUBMIT_FEEDBACK,
    Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT,
    Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE_TEAM,
  ],
  
  [Role.RECRUITER]: [
    Permission.JOBS_VIEW, Permission.JOBS_CREATE, Permission.JOBS_EDIT, Permission.JOBS_PUBLISH,
    Permission.CANDIDATES_VIEW, Permission.CANDIDATES_CREATE, Permission.CANDIDATES_EDIT,
    Permission.APPLICATIONS_VIEW, Permission.APPLICATIONS_CREATE, Permission.APPLICATIONS_UPDATE_STATUS,
    Permission.RESUMES_VIEW, Permission.RESUMES_UPLOAD,
    Permission.INTERVIEWS_VIEW, Permission.INTERVIEWS_SCHEDULE,
    Permission.REPORTS_VIEW,
  ],
  
  [Role.HIRING_MANAGER]: [
    Permission.JOBS_VIEW, Permission.JOBS_CREATE, Permission.JOBS_EDIT,
    Permission.CANDIDATES_VIEW,
    Permission.APPLICATIONS_VIEW, Permission.APPLICATIONS_UPDATE_STATUS,
    Permission.RESUMES_VIEW,
    Permission.INTERVIEWS_VIEW, Permission.INTERVIEWS_CONDUCT, Permission.INTERVIEWS_SUBMIT_FEEDBACK,
    Permission.REPORTS_VIEW,
  ],
  
  [Role.INTERVIEWER]: [
    Permission.JOBS_VIEW,
    Permission.CANDIDATES_VIEW,
    Permission.APPLICATIONS_VIEW,
    Permission.RESUMES_VIEW,
    Permission.INTERVIEWS_VIEW, Permission.INTERVIEWS_CONDUCT, Permission.INTERVIEWS_SUBMIT_FEEDBACK,
  ],
  
  [Role.VIEWER]: [
    Permission.JOBS_VIEW,
    Permission.CANDIDATES_VIEW,
    Permission.APPLICATIONS_VIEW,
    Permission.RESUMES_VIEW,
    Permission.INTERVIEWS_VIEW,
    Permission.REPORTS_VIEW,
  ],
};

// Role hierarchy (higher roles include lower role permissions)
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [Role.SYSTEM_ADMIN]: [Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
  [Role.TENANT_ADMIN]: [Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
  [Role.HR_ADMIN]: [Role.RECRUITER, Role.HIRING_MANAGER, Role.INTERVIEWER, Role.VIEWER],
  [Role.RECRUITER]: [Role.VIEWER],
  [Role.HIRING_MANAGER]: [Role.INTERVIEWER, Role.VIEWER],
  [Role.INTERVIEWER]: [Role.VIEWER],
  [Role.VIEWER]: [],
};

interface PermissionsContextType {
  role: Role | null;
  permissions: Permission[];
  hasRole: (role: Role) => boolean;
  hasAnyRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (...permissions: Permission[]) => boolean;
  hasAllPermissions: (...permissions: Permission[]) => boolean;
  isAtLeast: (role: Role) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionsContextType>(() => {
    const userRole = (user?.role as Role) || null;
    
    // Get all permissions for this role (including inherited from hierarchy)
    const getPermissionsForRole = (role: Role): Permission[] => {
      const directPermissions = ROLE_PERMISSIONS[role] || [];
      const inheritedRoles = ROLE_HIERARCHY[role] || [];
      const inheritedPermissions = inheritedRoles.flatMap(r => ROLE_PERMISSIONS[r] || []);
      return Array.from(new Set([...directPermissions, ...inheritedPermissions]));
    };

    const permissions = userRole ? getPermissionsForRole(userRole) : [];

    return {
      role: userRole,
      permissions,
      
      hasRole: (role: Role) => userRole === role,
      
      hasAnyRole: (...roles: Role[]) => userRole ? roles.includes(userRole) : false,
      
      hasPermission: (permission: Permission) => permissions.includes(permission),
      
      hasAnyPermission: (...perms: Permission[]) => perms.some(p => permissions.includes(p)),
      
      hasAllPermissions: (...perms: Permission[]) => perms.every(p => permissions.includes(p)),
      
      isAtLeast: (role: Role) => {
        if (!userRole) return false;
        if (userRole === role) return true;
        return ROLE_HIERARCHY[userRole]?.includes(role) || false;
      },
    };
  }, [user?.role]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}

// Helper components for conditional rendering

interface CanAccessProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CanAccess({ 
  permission, 
  permissions, 
  requireAll = false, 
  children, 
  fallback = null 
}: CanAccessProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(...permissions) : hasAnyPermission(...permissions);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RequireRoleProps {
  role?: Role;
  roles?: Role[];
  atLeast?: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ 
  role, 
  roles, 
  atLeast, 
  children, 
  fallback = null 
}: RequireRoleProps) {
  const { hasRole, hasAnyRole, isAtLeast } = usePermissions();
  
  let hasAccess = false;
  
  if (role) {
    hasAccess = hasRole(role);
  } else if (roles) {
    hasAccess = hasAnyRole(...roles);
  } else if (atLeast) {
    hasAccess = isAtLeast(atLeast);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Role display helpers
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.SYSTEM_ADMIN]: 'System Admin',
  [Role.TENANT_ADMIN]: 'Admin',
  [Role.HR_ADMIN]: 'HR Admin',
  [Role.RECRUITER]: 'Recruiter',
  [Role.HIRING_MANAGER]: 'Hiring Manager',
  [Role.INTERVIEWER]: 'Interviewer',
  [Role.VIEWER]: 'Viewer',
};

export const ROLE_COLORS: Record<Role, string> = {
  [Role.SYSTEM_ADMIN]: 'bg-red-100 text-red-700',
  [Role.TENANT_ADMIN]: 'bg-purple-100 text-purple-700',
  [Role.HR_ADMIN]: 'bg-blue-100 text-blue-700',
  [Role.RECRUITER]: 'bg-green-100 text-green-700',
  [Role.HIRING_MANAGER]: 'bg-orange-100 text-orange-700',
  [Role.INTERVIEWER]: 'bg-yellow-100 text-yellow-700',
  [Role.VIEWER]: 'bg-gray-100 text-gray-700',
};

