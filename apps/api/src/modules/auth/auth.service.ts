import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { JwtPayload } from '../../common/decorators/user.decorator';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    tenantName: string;
  };
}

export interface AzureAdProfile {
  oid: string;        // Azure AD Object ID
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  tid?: string;       // Azure AD Tenant ID (not our tenant)
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
  ) {}

  /**
   * Handle Azure AD callback and generate tokens
   */
  async handleAzureAdCallback(profile: AzureAdProfile, tenantSlug?: string): Promise<TokenResponse> {
    this.logger.log(`Azure AD login for: ${profile.email}`);

    // Find or determine tenant
    let tenant;
    if (tenantSlug) {
      tenant = await this.tenantsService.findBySlug(tenantSlug);
      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }
    }

    // Find user by external ID or email
    let user = await this.usersService.findByExternalId(profile.oid);
    
    if (!user) {
      // Try to find by email within the tenant
      if (tenant) {
        user = await this.usersService.findByEmail(tenant.id, profile.email);
      }
    }

    if (!user) {
      // Auto-provision user if tenant allows it
      const tenantSettings = tenant ? JSON.parse(tenant.settings || '{}') : {};
      if (tenant && tenantSettings.autoProvisionUsers) {
        user = await this.usersService.create({
          tenantId: tenant.id,
          email: profile.email,
          firstName: profile.given_name || profile.name?.split(' ')[0] || 'User',
          lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
          externalId: profile.oid,
          role: tenantSettings.defaultRole || 'viewer',
        });
        this.logger.log(`Auto-provisioned user: ${user!.email}`);
      } else {
        throw new UnauthorizedException('User not found. Please contact your administrator.');
      }
    }

    // Update external ID if not set
    if (!user!.externalId) {
      await this.usersService.update(user!.id, { externalId: profile.oid });
    }

    // Update last login
    await this.usersService.updateLastLogin(user!.id);

    // Get tenant info
    const userTenant = await this.tenantsService.findById(user!.tenantId);

    return this.generateTokens(user, userTenant);
  }

  /**
   * Generate JWT tokens for a user
   */
  async generateTokens(user: any, tenant: any): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: [user.role],
      permissions: user.permissions || [],
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.configService.get('jwt.refreshExpiresIn') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name || '',
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(decoded.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const tenant = await this.tenantsService.findById(user.tenantId);
      
      return this.generateTokens(user, tenant);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate JWT payload and return user
   */
  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Verify tenant is active
    const tenant = await this.tenantsService.findById(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant not found or inactive');
    }

    return user;
  }

  /**
   * Logout - invalidate tokens (for future token blacklist implementation)
   */
  async logout(userId: string): Promise<void> {
    this.logger.log(`User logged out: ${userId}`);
    // TODO: Implement token blacklist with Redis
  }

  /**
   * Demo login - creates a test tenant and user for development/testing
   * This should be disabled in production!
   */
  async demoLogin(): Promise<TokenResponse> {
    const isDevelopment = this.configService.get('nodeEnv') !== 'production';
    
    if (!isDevelopment) {
      throw new UnauthorizedException('Demo login is not available in production');
    }

    this.logger.log('Demo login requested');

    // Check if demo tenant exists
    let tenant = await this.tenantsService.findBySlug('demo-company');
    
    if (!tenant) {
      // Create demo tenant
      tenant = await this.tenantsService.create({
        name: 'Demo Company',
        slug: 'demo-company',
        domain: 'demo.hirefit.local',
      });
      this.logger.log('Created demo tenant');
    }

    // Check if demo user exists
    let user = await this.usersService.findByEmail(tenant.id, 'demo@hirefit.local');
    
    if (!user) {
      // Create demo user
      user = await this.usersService.create({
        tenantId: tenant.id,
        email: 'demo@hirefit.local',
        firstName: 'Demo',
        lastName: 'User',
        role: 'tenant_admin',
      });
      this.logger.log('Created demo user');
    }

    // Update last login
    await this.usersService.updateLastLogin(user!.id);

    return this.generateTokens(user!, tenant);
  }
}

