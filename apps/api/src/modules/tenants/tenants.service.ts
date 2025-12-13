import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { FeaturesService } from '../features/features.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Individual user registration (primary flow)
export interface IndividualRegistrationDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface IndividualRegistrationResult {
  workspace: {
    id: string;
    name: string;
    slug: string;
    type: 'personal';
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  limits: {
    maxJobs: number;
    maxCandidates: number;
    maxAiScoresPerMonth: number;
  };
}

// Company tenant registration (secondary/enterprise flow)
export interface TenantRegistrationDto {
  companyName: string;
  companySlug?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword?: string; // For non-SSO signups
  industry?: string;
  companySize?: string;
}

export interface TenantRegistrationResult {
  tenant: {
    id: string;
    name: string;
    slug: string;
    type: 'company';
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  verificationToken?: string;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => FeaturesService))
    private featuresService: FeaturesService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    // Check if slug is unique
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Check if domain is unique (if provided)
    if (createTenantDto.domain) {
      const existingDomain = await this.prisma.tenant.findUnique({
        where: { domain: createTenantDto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Domain already registered');
      }
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        slug: createTenantDto.slug,
        domain: createTenantDto.domain,
        settings: JSON.stringify(createTenantDto.settings || {}),
        features: JSON.stringify(createTenantDto.features || {}),
      },
    });

    this.logger.log(`Created tenant: ${tenant.name} (${tenant.slug})`);
    return tenant;
  }

  async findAll(options?: { isActive?: boolean }) {
    return this.prisma.tenant.findMany({
      where: {
        isActive: options?.isActive,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
    });
  }

  async findByDomain(domain: string) {
    return this.prisma.tenant.findUnique({
      where: { domain },
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findById(id);

    // Check slug uniqueness if being updated
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existingSlug = await this.prisma.tenant.findUnique({
        where: { slug: updateTenantDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async updateSettings(id: string, settings: Record<string, any>) {
    const tenant = await this.findById(id);
    const existingSettings = JSON.parse(tenant.settings || '{}');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        settings: JSON.stringify({
          ...existingSettings,
          ...settings,
        }),
      },
    });
  }

  async updateFeatures(id: string, features: Record<string, any>) {
    const tenant = await this.findById(id);
    const existingFeatures = JSON.parse(tenant.features || '{}');

    return this.prisma.tenant.update({
      where: { id },
      data: {
        features: JSON.stringify({
          ...existingFeatures,
          ...features,
        }),
      },
    });
  }

  async deactivate(id: string) {
    await this.findById(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    await this.findById(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getStats(id: string) {
    await this.findById(id);

    const [userCount, jobCount, candidateCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.job.count({ where: { tenantId: id } }),
      this.prisma.candidate.count({ where: { tenantId: id } }),
    ]);

    return {
      users: userCount,
      jobs: jobCount,
      candidates: candidateCount,
    };
  }

  /**
   * Self-service tenant registration
   * Creates a new tenant and admin user
   */
  async register(dto: TenantRegistrationDto): Promise<TenantRegistrationResult> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.adminEmail)) {
      throw new BadRequestException('Invalid email format');
    }

    // Generate slug from company name if not provided
    const slug = dto.companySlug || this.generateSlug(dto.companyName);

    // Check if slug is unique
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Company name already registered. Please choose a different name.');
    }

    // Check if email is already used
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered. Please sign in or use a different email.');
    }

    // Create tenant and admin user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create company tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug,
          type: 'company',  // Company tenant
          subscriptionTier: 'team',  // Company starts with team tier
          maxJobs: 50,
          maxCandidates: 2000,
          maxAiScoresPerMonth: 500,
          maxTeamMembers: 10,
          settings: JSON.stringify({
            industry: dto.industry,
            companySize: dto.companySize,
            autoProvisionUsers: false, // Require admin approval by default
            defaultRole: 'viewer',
            onboardingCompleted: false,
          }),
          features: JSON.stringify({
            aiScoring: true,
            advancedAnalytics: false,
            customPipelines: true,
            integrations: false,
          }),
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: 'tenant_admin',
          isActive: true, // Active immediately for Phase 1 (no email verification)
        },
      });

      this.logger.log(`Registered new tenant: ${tenant.name} (${tenant.slug}) with admin: ${user.email}`);

      return { tenant, user };
    });

    // Initialize features for the tenant based on subscription tier
    await this.featuresService.initializeTenantFeatures(result.tenant.id, 'team');

    // In production, generate verification token and send email
    // For Phase 1, we skip email verification
    const verificationToken = this.generateVerificationToken();

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        type: 'company' as const,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      verificationToken, // Would be sent via email in production
    };
  }

  /**
   * Individual user registration (PRIMARY FLOW)
   * Creates a personal workspace with free tier limits
   */
  async registerIndividual(dto: IndividualRegistrationDto): Promise<IndividualRegistrationResult> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new BadRequestException('Invalid email format');
    }

    // Check if email is already used
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        throw new ConflictException(
          'Email already registered but not verified. Please check your email for the verification link, or use the resend verification feature.',
        );
      }
      throw new ConflictException('Email already registered. Please sign in.');
    }

    // Generate slug from user's name
    const baseSlug = this.generateSlug(`${dto.firstName}-${dto.lastName}`);
    let slug = baseSlug;
    let suffix = 1;

    // Ensure unique slug
    while (await this.prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // Free tier limits
    const FREE_TIER_LIMITS = {
      maxJobs: 3,
      maxCandidates: 50,
      maxAiScoresPerMonth: 20,
      maxTeamMembers: 1,
    };

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create personal workspace and user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create personal workspace
      const workspace = await tx.tenant.create({
        data: {
          name: `${dto.firstName}'s Workspace`,
          slug,
          type: 'personal',
          subscriptionTier: 'free',
          ...FREE_TIER_LIMITS,
          settings: JSON.stringify({
            onboardingCompleted: false,
          }),
          features: JSON.stringify({
            aiScoring: true,  // Available but limited
            advancedAnalytics: false,
            customPipelines: true,
            integrations: false,
          }),
        },
      });

      // Create owner user with password hash and verification token
      const user = await tx.user.create({
        data: {
          tenantId: workspace.id,
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'tenant_admin',  // Owner has full control
          isActive: true,
          passwordHash,
          emailVerified: false, // Email not verified yet
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      });

      // Update workspace with owner reference
      await tx.tenant.update({
        where: { id: workspace.id },
        data: { ownerId: user.id },
      });

      this.logger.log(`Registered individual user: ${user.email} with personal workspace: ${workspace.slug}`);

      return { workspace, user, verificationToken };
    });

    // Initialize features for the workspace based on free tier
    await this.featuresService.initializeTenantFeatures(result.workspace.id, 'free');

    // Send verification email
    const webUrl = this.configService.get<string>('WEB_URL') || this.configService.get<string>('webUrl') || 'http://localhost:3002';
    const verificationUrl = `${webUrl}/verify-email?token=${result.verificationToken}`;
    
    try {
      const emailResult = await this.emailService.sendVerificationEmail({
        email: result.user.email,
        firstName: result.user.firstName,
        verificationUrl,
      });
      
      if (emailResult.success) {
        this.logger.log(`Verification email sent successfully to ${result.user.email} (Message ID: ${emailResult.messageId})`);
      } else {
        this.logger.error(`Failed to send verification email to ${result.user.email}: ${emailResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${result.user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      // Don't fail signup if email fails, but log it
    }

    return {
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
        type: 'personal',
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      limits: FREE_TIER_LIMITS,
    };
  }

  /**
   * Check if a slug is available
   */
  async checkSlugAvailability(slug: string): Promise<{ available: boolean; suggestion?: string }> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: this.generateSlug(slug) },
    });

    if (!existing) {
      return { available: true };
    }

    // Generate alternative suggestions
    const suggestion = `${this.generateSlug(slug)}-${Math.floor(Math.random() * 1000)}`;
    return { available: false, suggestion };
  }

  /**
   * Generate a URL-safe slug from a company name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Generate a mock verification token
   */
  private generateVerificationToken(): string {
    return `verify-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Convert a personal workspace to a company workspace
   * Preserves all existing data but upgrades limits and enables team features
   */
  async convertToCompany(
    tenantId: string,
    companyName: string,
    companySlug?: string,
  ): Promise<{
    success: boolean;
    tenant: { id: string; name: string; slug: string; type: string };
    newLimits: { maxJobs: number; maxCandidates: number; maxAiScoresPerMonth: number; maxTeamMembers: number };
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Workspace not found');
    }

    if (tenant.type === 'company') {
      throw new BadRequestException('Workspace is already a company account');
    }

    // Generate or validate slug
    const slug = companySlug || this.generateSlug(companyName);

    // Check if slug is unique (and different from current)
    if (slug !== tenant.slug) {
      const existingSlug = await this.prisma.tenant.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        throw new ConflictException('Company name already in use. Please choose a different name.');
      }
    }

    // Team tier limits
    const TEAM_LIMITS = {
      maxJobs: 50,
      maxCandidates: 2000,
      maxAiScoresPerMonth: 500,
      maxTeamMembers: 5,
    };

    // Update tenant
    const updatedTenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: companyName,
        slug,
        type: 'company',
        subscriptionTier: 'team',
        ...TEAM_LIMITS,
        features: JSON.stringify({
          aiScoring: true,
          advancedAnalytics: true,
          customPipelines: true,
          integrations: true,
          teamCollaboration: true,
        }),
      },
    });

    // Upgrade features to team tier
    await this.featuresService.upgradeTenantFeatures(tenantId, 'team');

    this.logger.log(`Converted personal workspace ${tenantId} to company: ${companyName} (${slug})`);

    return {
      success: true,
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        type: updatedTenant.type,
      },
      newLimits: TEAM_LIMITS,
    };
  }
}

