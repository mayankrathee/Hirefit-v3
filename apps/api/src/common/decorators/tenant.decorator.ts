import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator to extract tenant ID from request
 * 
 * @example
 * @Get('items')
 * findAll(@TenantId() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.tenantId;
  },
);

/**
 * Parameter decorator to extract full tenant object from request
 */
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.tenant;
  },
);

