import { SetMetadata } from '@nestjs/common';

export enum Role {
  SYSTEM_ADMIN = 'system_admin',
  TENANT_ADMIN = 'tenant_admin',
  HR_ADMIN = 'hr_admin',
  RECRUITER = 'recruiter',
  HIRING_MANAGER = 'hiring_manager',
  INTERVIEWER = 'interviewer',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * 
 * @example
 * @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
 * @Get('admin-only')
 * adminOnlyEndpoint() {}
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

