import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;          // User ID
  email: string;
  tenantId: string;
  roles: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Parameter decorator to extract current user from request
 * 
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return this.service.findOne(user.sub);
 * }
 * 
 * @example
 * @Get('email')
 * getEmail(@CurrentUser('email') email: string) {
 *   return { email };
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * Parameter decorator to extract user ID
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    return user?.sub;
  },
);

