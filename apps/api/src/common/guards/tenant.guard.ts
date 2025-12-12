import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const SKIP_TENANT_CHECK = 'skipTenantCheck';
export const SkipTenantCheck = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(SKIP_TENANT_CHECK, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(SKIP_TENANT_CHECK, true, target);
    return target;
  };
};

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if tenant check should be skipped (e.g., for auth or health endpoints)
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Public routes don't need tenant context
    const publicPaths = ['/health', '/ready', '/docs', '/api/v1/auth'];
    if (publicPaths.some(path => request.path.startsWith(path))) {
      return true;
    }

    // For authenticated requests, tenant should be set
    if (request.user) {
      const userTenantId = (request.user as any).tenantId;
      const requestTenantId = request.tenantId;

      // If user has a tenant, verify it matches the request tenant
      if (userTenantId && requestTenantId && userTenantId !== requestTenantId) {
        throw new ForbiddenException('Tenant access denied');
      }

      // Set tenant ID from user if not already set
      if (!request.tenantId && userTenantId) {
        request.tenantId = userTenantId;
      }

      // Require tenant context for most operations
      if (!request.tenantId) {
        throw new ForbiddenException('Tenant context required');
      }
    }

    return true;
  }
}

