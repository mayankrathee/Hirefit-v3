import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeaturesService } from '../../modules/features/features.service';

/**
 * Metadata key for required features
 */
export const REQUIRED_FEATURE_KEY = 'required_feature';

/**
 * Options for feature requirement
 */
export interface RequireFeatureOptions {
  /** Feature ID to check */
  featureId: string;
  /** Whether to increment usage counter when accessing this endpoint */
  trackUsage?: boolean;
}

/**
 * Decorator to require a specific feature to be enabled
 * @example
 * @RequireFeature('ai_screening')
 * @Post('jobs/:id/resumes')
 * async uploadResume() { ... }
 *
 * @example
 * @RequireFeature({ featureId: 'ai_screening', trackUsage: true })
 * @Post('jobs/:id/score')
 * async scoreResume() { ... }
 */
export function RequireFeature(options: string | RequireFeatureOptions) {
  const featureOptions: RequireFeatureOptions =
    typeof options === 'string' ? { featureId: options, trackUsage: false } : options;
  return SetMetadata(REQUIRED_FEATURE_KEY, featureOptions);
}

/**
 * Guard that checks if a feature is enabled for the current tenant
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featuresService: FeaturesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureOptions = this.reflector.getAllAndOverride<RequireFeatureOptions>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature requirement, allow access
    if (!featureOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // If no tenant context, skip feature check (handled by TenantGuard)
    if (!tenantId) {
      return true;
    }

    const { featureId, trackUsage } = featureOptions;

    try {
      // Check if feature can be used (enabled + within limits)
      const canUse = await this.featuresService.canUseFeature(tenantId, featureId);

      if (!canUse) {
        const status = await this.featuresService.getFeatureStatus(tenantId, featureId);

        if (!status.enabled) {
          throw new ForbiddenException(
            `The '${status.name}' feature is not available on your current plan. Please upgrade to access this feature.`,
          );
        }

        if (status.usageLimited && status.remaining === 0) {
          throw new ForbiddenException(
            `You have reached the usage limit for '${status.name}' (${status.used}/${status.limit}). Please upgrade your plan for more usage.`,
          );
        }
      }

      // If tracking usage, increment the counter
      if (trackUsage) {
        await this.featuresService.incrementUsage(tenantId, featureId);
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // For other errors (e.g., feature not found), deny access
      throw new ForbiddenException(
        `Unable to verify feature access. Please contact support.`,
      );
    }
  }
}

