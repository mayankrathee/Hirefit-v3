import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: {
        id: string;
        name: string;
        slug: string;
        settings?: Record<string, any>;
      };
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from various sources
    const tenantId = this.extractTenantId(req);

    if (tenantId) {
      req.tenantId = tenantId;
      this.logger.debug(`Tenant context set: ${tenantId}`);
    }

    next();
  }

  private extractTenantId(req: Request): string | undefined {
    // Priority order for tenant identification:
    
    // 1. Header (X-Tenant-ID) - for API calls
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. JWT claims (set by auth guard later)
    // This will be populated after JWT validation
    if (req.user && (req.user as any).tenantId) {
      return (req.user as any).tenantId;
    }

    // 3. Subdomain extraction (for multi-tenant SaaS)
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);
    if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
      return subdomain;
    }

    // 4. Query parameter (for testing/debugging only in development)
    if (process.env.NODE_ENV === 'development' && req.query.tenantId) {
      return req.query.tenantId as string;
    }

    return undefined;
  }

  private extractSubdomain(host: string): string | undefined {
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // Split by dots
    const parts = hostname.split('.');
    
    // If we have more than 2 parts (e.g., tenant.hirefit.io)
    if (parts.length > 2) {
      return parts[0];
    }

    return undefined;
  }
}

