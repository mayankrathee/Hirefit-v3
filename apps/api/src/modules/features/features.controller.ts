import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeaturesService } from './features.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('features')
@Controller('features')
@ApiBearerAuth('JWT-auth')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get('definitions')
  @Public()
  @ApiOperation({ summary: 'Get all available feature definitions' })
  @ApiResponse({ status: 200, description: 'List of all feature definitions' })
  async getAllFeatures() {
    return this.featuresService.getAllFeatures();
  }

  @Get('definitions/:featureId')
  @Public()
  @ApiOperation({ summary: 'Get a specific feature definition' })
  @ApiResponse({ status: 200, description: 'Feature definition' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async getFeature(@Param('featureId') featureId: string) {
    return this.featuresService.getFeature(featureId);
  }

  @Get('tiers')
  @Public()
  @ApiOperation({ summary: 'Get all subscription tier configurations' })
  @ApiResponse({ status: 200, description: 'List of tier configurations' })
  getAllTiers() {
    return this.featuresService.getAllTiers();
  }

  @Get('tiers/:tier')
  @Public()
  @ApiOperation({ summary: 'Get features included in a specific tier' })
  @ApiResponse({ status: 200, description: 'Tier feature configuration' })
  getTierFeatures(@Param('tier') tier: string) {
    return this.featuresService.getTierFeatures(tier);
  }

  @Get('tenant')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get all feature statuses for current tenant' })
  @ApiResponse({ status: 200, description: 'List of feature statuses for tenant' })
  async getTenantFeatures(@TenantId() tenantId: string) {
    return this.featuresService.getAllFeatureStatuses(tenantId);
  }

  @Get('tenant/enabled')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get only enabled features for current tenant' })
  @ApiResponse({ status: 200, description: 'List of enabled features' })
  async getEnabledFeatures(@TenantId() tenantId: string) {
    return this.featuresService.getEnabledFeatures(tenantId);
  }

  @Get('tenant/:featureId')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get status of a specific feature for current tenant' })
  @ApiResponse({ status: 200, description: 'Feature status' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async getFeatureStatus(
    @TenantId() tenantId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.featuresService.getFeatureStatus(tenantId, featureId);
  }

  @Get('tenant/:featureId/can-use')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Check if current tenant can use a feature' })
  @ApiResponse({ status: 200, description: 'Boolean indicating if feature can be used' })
  async canUseFeature(
    @TenantId() tenantId: string,
    @Param('featureId') featureId: string,
  ) {
    const canUse = await this.featuresService.canUseFeature(tenantId, featureId);
    return { canUse };
  }

  @Post('tenant/:featureId/enable')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Enable a feature for current tenant (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature enabled' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async enableFeature(
    @TenantId() tenantId: string,
    @Param('featureId') featureId: string,
    @Body('customLimit') customLimit?: number,
  ) {
    return this.featuresService.enableFeature(tenantId, featureId, customLimit);
  }

  @Post('tenant/:featureId/disable')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Disable a feature for current tenant (admin only)' })
  @ApiResponse({ status: 200, description: 'Feature disabled' })
  @ApiResponse({ status: 400, description: 'Cannot disable standard feature' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async disableFeature(
    @TenantId() tenantId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.featuresService.disableFeature(tenantId, featureId);
  }

  @Post('tenant/:featureId/limit')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Set custom usage limit for a feature (admin only)' })
  @ApiResponse({ status: 200, description: 'Limit updated' })
  @ApiResponse({ status: 400, description: 'Feature does not support usage limits' })
  @ApiResponse({ status: 404, description: 'Feature not found' })
  async setFeatureLimit(
    @TenantId() tenantId: string,
    @Param('featureId') featureId: string,
    @Body('limit') limit: number | null,
  ) {
    return this.featuresService.setFeatureLimit(tenantId, featureId, limit);
  }

  @Post('admin/tenant/:tenantId/initialize')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Initialize features for a tenant based on tier (system admin only)' })
  @ApiResponse({ status: 200, description: 'Features initialized' })
  async initializeTenantFeatures(
    @Param('tenantId') tenantId: string,
    @Body('tier') tier: string,
  ) {
    return this.featuresService.initializeTenantFeatures(tenantId, tier);
  }

  @Post('admin/tenant/:tenantId/upgrade')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Upgrade tenant features to a new tier (system admin only)' })
  @ApiResponse({ status: 200, description: 'Features upgraded' })
  async upgradeTenantFeatures(
    @Param('tenantId') tenantId: string,
    @Body('tier') tier: string,
  ) {
    return this.featuresService.upgradeTenantFeatures(tenantId, tier);
  }
}

