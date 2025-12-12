import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureDefinition, TenantFeature } from '@prisma/client';

/**
 * Feature types determine the pricing model
 */
export enum FeatureType {
  STANDARD = 'standard',   // Always included (core features)
  FREEMIUM = 'freemium',   // Free with limits
  PREMIUM = 'premium',     // Paid feature
  ADDON = 'addon',         // Optional paid add-on
  ENTERPRISE = 'enterprise', // Enterprise-only
}

/**
 * Subscription tier to feature mapping
 */
const TIER_FEATURES: Record<string, { features: string[]; limits?: Record<string, number> }> = {
  free: {
    features: ['core', 'ai_screening'],
    limits: {
      ai_screening: 20,
    },
  },
  pro: {
    features: ['core', 'ai_screening', 'scheduler'],
    limits: {
      ai_screening: 100,
    },
  },
  team: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview'],
    limits: {
      ai_screening: 500,
      ai_interview: 50,
    },
  },
  enterprise: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview', 'integrations'],
    limits: {
      // Unlimited - no limits
    },
  },
};

export interface FeatureStatus {
  featureId: string;
  name: string;
  description: string;
  enabled: boolean;
  usageLimited: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  canUse: boolean;
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all feature definitions
   */
  async getAllFeatures(): Promise<FeatureDefinition[]> {
    return this.prisma.featureDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get a single feature definition
   */
  async getFeature(featureId: string): Promise<FeatureDefinition> {
    const feature = await this.prisma.featureDefinition.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      throw new NotFoundException(`Feature '${featureId}' not found`);
    }

    return feature;
  }

  /**
   * Check if a feature is enabled for a tenant
   */
  async isFeatureEnabled(tenantId: string, featureId: string): Promise<boolean> {
    // First check the feature definition exists
    const feature = await this.getFeature(featureId);

    // Standard features are always enabled
    if (feature.type === FeatureType.STANDARD) {
      return true;
    }

    // Check tenant-specific feature configuration
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
    });

    // If no tenant feature entry, use default from feature definition
    if (!tenantFeature) {
      return feature.defaultEnabled;
    }

    return tenantFeature.enabled;
  }

  /**
   * Check if tenant can use a feature (enabled AND within limits)
   */
  async canUseFeature(tenantId: string, featureId: string): Promise<boolean> {
    const status = await this.getFeatureStatus(tenantId, featureId);
    return status.canUse;
  }

  /**
   * Get detailed feature status for a tenant
   */
  async getFeatureStatus(tenantId: string, featureId: string): Promise<FeatureStatus> {
    const feature = await this.getFeature(featureId);
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
    });

    // Standard features are always enabled
    const isStandard = feature.type === FeatureType.STANDARD;
    const enabled = isStandard || (tenantFeature?.enabled ?? feature.defaultEnabled);

    // Calculate usage
    const usageLimited = feature.usageLimited;
    const limit = tenantFeature?.usageLimit ?? feature.defaultLimit;
    const used = tenantFeature?.usageCount ?? 0;
    const remaining = limit !== null ? Math.max(0, limit - used) : null;

    // Can use if enabled AND (not usage limited OR within limits)
    const canUse = enabled && (!usageLimited || limit === null || used < limit);

    return {
      featureId: feature.id,
      name: feature.name,
      description: feature.description,
      enabled,
      usageLimited,
      limit,
      used,
      remaining,
      canUse,
    };
  }

  /**
   * Check usage limit for a feature
   * Throws ForbiddenException if limit exceeded
   */
  async checkFeatureLimit(tenantId: string, featureId: string): Promise<void> {
    const status = await this.getFeatureStatus(tenantId, featureId);

    if (!status.enabled) {
      throw new ForbiddenException(
        `Feature '${status.name}' is not enabled for your account. Please upgrade your plan.`,
      );
    }

    if (status.usageLimited && !status.canUse) {
      throw new ForbiddenException(
        `You have reached the usage limit for '${status.name}' (${status.used}/${status.limit}). Please upgrade your plan for more usage.`,
      );
    }
  }

  /**
   * Increment usage counter for a feature
   * Returns updated status
   */
  async incrementUsage(tenantId: string, featureId: string): Promise<FeatureStatus> {
    // First check if feature allows usage
    await this.checkFeatureLimit(tenantId, featureId);

    const feature = await this.getFeature(featureId);

    if (!feature.usageLimited) {
      // Feature doesn't have usage limits, return current status
      return this.getFeatureStatus(tenantId, featureId);
    }

    // Reset usage if new month
    await this.resetUsageIfNeeded(tenantId, featureId);

    // Increment usage
    const tenantFeature = await this.prisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
      update: {
        usageCount: { increment: 1 },
      },
      create: {
        tenantId,
        featureId,
        enabled: feature.defaultEnabled,
        usageLimit: feature.defaultLimit,
        usageCount: 1,
      },
    });

    this.logger.log(
      `Incremented usage for feature ${featureId} on tenant ${tenantId}: ${tenantFeature.usageCount}`,
    );

    return this.getFeatureStatus(tenantId, featureId);
  }

  /**
   * Reset usage if we're in a new month
   */
  private async resetUsageIfNeeded(tenantId: string, featureId: string): Promise<void> {
    const tenantFeature = await this.prisma.tenantFeature.findUnique({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
    });

    if (!tenantFeature) return;

    const now = new Date();
    const resetDate = new Date(tenantFeature.usageResetDate);

    // Check if we're in a new month
    if (
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear()
    ) {
      await this.prisma.tenantFeature.update({
        where: {
          tenantId_featureId: { tenantId, featureId },
        },
        data: {
          usageCount: 0,
          usageResetDate: now,
        },
      });
      this.logger.log(`Reset monthly usage for feature ${featureId} on tenant ${tenantId}`);
    }
  }

  /**
   * Get all enabled features for a tenant
   */
  async getEnabledFeatures(tenantId: string): Promise<FeatureStatus[]> {
    const allFeatures = await this.getAllFeatures();
    const statuses: FeatureStatus[] = [];

    for (const feature of allFeatures) {
      const status = await this.getFeatureStatus(tenantId, feature.id);
      if (status.enabled) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Get all features with status for a tenant
   */
  async getAllFeatureStatuses(tenantId: string): Promise<FeatureStatus[]> {
    const allFeatures = await this.getAllFeatures();
    const statuses: FeatureStatus[] = [];

    for (const feature of allFeatures) {
      statuses.push(await this.getFeatureStatus(tenantId, feature.id));
    }

    return statuses;
  }

  /**
   * Enable a feature for a tenant
   */
  async enableFeature(
    tenantId: string,
    featureId: string,
    customLimit?: number,
  ): Promise<TenantFeature> {
    const feature = await this.getFeature(featureId);

    const tenantFeature = await this.prisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
      update: {
        enabled: true,
        usageLimit: customLimit ?? feature.defaultLimit,
      },
      create: {
        tenantId,
        featureId,
        enabled: true,
        usageLimit: customLimit ?? feature.defaultLimit,
      },
    });

    this.logger.log(`Enabled feature ${featureId} for tenant ${tenantId}`);
    return tenantFeature;
  }

  /**
   * Disable a feature for a tenant
   */
  async disableFeature(tenantId: string, featureId: string): Promise<TenantFeature> {
    const feature = await this.getFeature(featureId);

    // Cannot disable standard features
    if (feature.type === FeatureType.STANDARD) {
      throw new BadRequestException(`Cannot disable standard feature '${feature.name}'`);
    }

    const tenantFeature = await this.prisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
      update: {
        enabled: false,
      },
      create: {
        tenantId,
        featureId,
        enabled: false,
      },
    });

    this.logger.log(`Disabled feature ${featureId} for tenant ${tenantId}`);
    return tenantFeature;
  }

  /**
   * Set custom usage limit for a tenant feature
   */
  async setFeatureLimit(
    tenantId: string,
    featureId: string,
    limit: number | null,
  ): Promise<TenantFeature> {
    const feature = await this.getFeature(featureId);

    if (!feature.usageLimited) {
      throw new BadRequestException(`Feature '${feature.name}' does not have usage limits`);
    }

    const tenantFeature = await this.prisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: { tenantId, featureId },
      },
      update: {
        usageLimit: limit,
      },
      create: {
        tenantId,
        featureId,
        enabled: feature.defaultEnabled,
        usageLimit: limit,
      },
    });

    this.logger.log(`Set usage limit for feature ${featureId} on tenant ${tenantId}: ${limit}`);
    return tenantFeature;
  }

  /**
   * Initialize features for a new tenant based on subscription tier
   */
  async initializeTenantFeatures(tenantId: string, tier: string): Promise<TenantFeature[]> {
    const tierConfig = TIER_FEATURES[tier] || TIER_FEATURES.free;
    const results: TenantFeature[] = [];

    for (const featureId of tierConfig.features) {
      const customLimit = tierConfig.limits?.[featureId];
      const tenantFeature = await this.enableFeature(tenantId, featureId, customLimit);
      results.push(tenantFeature);
    }

    this.logger.log(`Initialized ${results.length} features for tenant ${tenantId} (tier: ${tier})`);
    return results;
  }

  /**
   * Upgrade tenant features when subscription tier changes
   */
  async upgradeTenantFeatures(tenantId: string, newTier: string): Promise<TenantFeature[]> {
    const tierConfig = TIER_FEATURES[newTier] || TIER_FEATURES.free;
    const results: TenantFeature[] = [];

    // Enable all features for the new tier
    for (const featureId of tierConfig.features) {
      const customLimit = tierConfig.limits?.[featureId];
      const tenantFeature = await this.enableFeature(tenantId, featureId, customLimit);
      results.push(tenantFeature);
    }

    // Disable features not in the new tier
    const allFeatures = await this.getAllFeatures();
    for (const feature of allFeatures) {
      if (
        !tierConfig.features.includes(feature.id) &&
        feature.type !== FeatureType.STANDARD
      ) {
        await this.disableFeature(tenantId, feature.id);
      }
    }

    this.logger.log(`Upgraded features for tenant ${tenantId} to tier: ${newTier}`);
    return results;
  }

  /**
   * Get tier configuration
   */
  getTierFeatures(tier: string) {
    return TIER_FEATURES[tier] || TIER_FEATURES.free;
  }

  /**
   * Get all tier configurations
   */
  getAllTiers() {
    return Object.entries(TIER_FEATURES).map(([name, config]) => ({
      name,
      ...config,
    }));
  }
}

