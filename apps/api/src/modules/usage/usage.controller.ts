import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';

@ApiTags('usage')
@Controller('usage')
@ApiBearerAuth('JWT-auth')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @ApiOperation({ summary: 'Get current usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsage(@TenantId() tenantId: string) {
    return this.usageService.getUsageStats(tenantId);
  }

  @Get('limits/jobs')
  @ApiOperation({ summary: 'Check job creation limit' })
  @ApiResponse({ status: 200, description: 'Job limit status' })
  async checkJobLimit(@TenantId() tenantId: string) {
    return this.usageService.checkJobLimit(tenantId);
  }

  @Get('limits/candidates')
  @ApiOperation({ summary: 'Check candidate limit' })
  @ApiResponse({ status: 200, description: 'Candidate limit status' })
  async checkCandidateLimit(@TenantId() tenantId: string) {
    return this.usageService.checkCandidateLimit(tenantId);
  }

  @Get('limits/ai-scores')
  @ApiOperation({ summary: 'Check AI score limit' })
  @ApiResponse({ status: 200, description: 'AI score limit status' })
  async checkAiScoreLimit(@TenantId() tenantId: string) {
    return this.usageService.checkAiScoreLimit(tenantId);
  }

  @Get('limits/team')
  @ApiOperation({ summary: 'Check team member limit' })
  @ApiResponse({ status: 200, description: 'Team member limit status' })
  async checkTeamMemberLimit(@TenantId() tenantId: string) {
    return this.usageService.checkTeamMemberLimit(tenantId);
  }

  @Get('pricing')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get pricing tiers' })
  @ApiResponse({ status: 200, description: 'Pricing tiers' })
  async getPricing() {
    return this.usageService.getPricingTiers();
  }
}

