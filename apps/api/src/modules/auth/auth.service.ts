import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { EmailService } from '../email/email.service';
import { FeaturesService } from '../features/features.service';
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

export interface GoogleProfile {
  sub: string;        // Google user ID
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private emailService: EmailService,
    private featuresService: FeaturesService,
  ) {}

  /**
   * Email/password login
   */
  async loginWithPassword(email: string, password: string, tenantSlug?: string): Promise<TokenResponse> {
    this.logger.log(`Email/password login attempt for: ${email}`);

    // Find user by email (globally, not tenant-specific for login)
    const user = await this.usersService.findByEmailGlobal(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in using your OAuth provider or set a password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Please contact support.');
    }

    // If tenant slug provided, verify it matches user's tenant
    if (tenantSlug) {
      const tenant = await this.tenantsService.findBySlug(tenantSlug);
      if (!tenant || tenant.id !== user.tenantId) {
        throw new BadRequestException('Invalid tenant');
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Get tenant info
    const tenant = await this.tenantsService.findById(user.tenantId);

    return this.generateTokens(user, tenant);
  }

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

    // Mark email as verified for OAuth users (Microsoft verifies emails)
    if (!user!.emailVerified) {
      await this.usersService.update(user!.id, {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }

    // Update last login
    await this.usersService.updateLastLogin(user!.id);

    // Get tenant info
    const userTenant = await this.tenantsService.findById(user!.tenantId);

    return this.generateTokens(user, userTenant);
  }

  /**
   * Handle Google OAuth callback and generate tokens
   */
  async handleGoogleCallback(profile: GoogleProfile, tenantSlug?: string): Promise<TokenResponse> {
    this.logger.log(`Google login for: ${profile.email}`);

    // Find or determine tenant
    let tenant;
    if (tenantSlug) {
      tenant = await this.tenantsService.findBySlug(tenantSlug);
      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }
    }

    // Find user by external ID (Google sub) or email
    let user = await this.usersService.findByExternalId(`google:${profile.sub}`);
    
    if (!user) {
      // Try to find by email globally
      user = await this.usersService.findByEmailGlobal(profile.email);
      
      if (user && !user.externalId) {
        // Link Google account to existing user
        await this.usersService.update(user.id, { externalId: `google:${profile.sub}` });
      }
    }

    if (!user) {
      // For new Google OAuth users, create a personal workspace and account
      // Generate slug from name
      const nameSlug = `${profile.given_name || 'user'}-${profile.family_name || ''}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user';
      let slug = nameSlug;
      let suffix = 1;

      // Ensure unique slug
      while (await this.tenantsService.findBySlug(slug)) {
        slug = `${nameSlug}-${suffix}`;
        suffix++;
      }

      // Create personal workspace
      tenant = await this.tenantsService.create({
        name: `${profile.given_name || 'User'}'s Workspace`,
        slug,
        type: 'personal',
        subscriptionTier: 'free',
        maxJobs: 3,
        maxCandidates: 50,
        maxAiScoresPerMonth: 20,
        maxTeamMembers: 1,
      });

      // Create user
      user = await this.usersService.create({
        tenantId: tenant.id,
        email: profile.email,
        firstName: profile.given_name || profile.name?.split(' ')[0] || 'User',
        lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
        externalId: `google:${profile.sub}`,
        role: 'tenant_admin',
      });

      // Mark email as verified (Google verifies emails)
      await this.usersService.update(user.id, {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      // Initialize features for the workspace
      await this.featuresService.initializeTenantFeatures(tenant.id, 'free');

      this.logger.log(`Created new user from Google: ${user.email}`);
    } else {
      // Update external ID if not set
      if (!user.externalId) {
        await this.usersService.update(user.id, { externalId: `google:${profile.sub}` });
      }

      // Mark email as verified for OAuth users (Google verifies emails)
      if (!user.emailVerified) {
        await this.usersService.update(user.id, {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        });
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Get tenant info
    const userTenant = await this.tenantsService.findById(user.tenantId);

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

}

