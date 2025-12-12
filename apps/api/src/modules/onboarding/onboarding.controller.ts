import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService, OnboardingStep } from './onboarding.service';
import { UserId } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';

@ApiTags('onboarding')
@Controller('onboarding')
@ApiBearerAuth('JWT-auth')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // ============================================================================
  // ONBOARDING PROGRESS
  // ============================================================================

  @Get('progress')
  @ApiOperation({ summary: 'Get onboarding progress' })
  @ApiResponse({ status: 200, description: 'Onboarding progress' })
  getProgress(@UserId() userId: string) {
    return this.onboardingService.getOnboardingProgress(userId);
  }

  @Patch('progress')
  @ApiOperation({ summary: 'Update onboarding step' })
  @ApiResponse({ status: 200, description: 'Updated progress' })
  updateProgress(
    @UserId() userId: string,
    @Body() body: { step: OnboardingStep },
  ) {
    return this.onboardingService.updateOnboardingStep(userId, body.step);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  completeOnboarding(@UserId() userId: string) {
    return this.onboardingService.completeOnboarding(userId);
  }

  @Post('dismiss')
  @ApiOperation({ summary: 'Dismiss onboarding (skip)' })
  @ApiResponse({ status: 200, description: 'Onboarding dismissed' })
  dismissOnboarding(@UserId() userId: string) {
    return this.onboardingService.dismissOnboarding(userId);
  }

  // ============================================================================
  // FEATURE DISCOVERY
  // ============================================================================

  @Get('features')
  @ApiOperation({ summary: 'Get feature discovery state' })
  @ApiResponse({ status: 200, description: 'Feature discovery state' })
  getFeatureState(@UserId() userId: string) {
    return this.onboardingService.getFeatureDiscoveryState(userId);
  }

  @Get('features/prompts')
  @ApiOperation({ summary: 'Get active feature prompts' })
  @ApiResponse({ status: 200, description: 'Active feature prompts' })
  getFeaturePrompts(@UserId() userId: string) {
    return this.onboardingService.getActiveFeaturePrompts(userId);
  }

  @Post('features/:featureId/discovered')
  @ApiOperation({ summary: 'Mark feature as discovered' })
  @ApiResponse({ status: 200, description: 'Feature marked as discovered' })
  markDiscovered(
    @UserId() userId: string,
    @Body() body: { featureId: string },
  ) {
    return this.onboardingService.markFeatureDiscovered(userId, body.featureId);
  }

  @Post('features/:featureId/dismiss')
  @ApiOperation({ summary: 'Dismiss feature prompt' })
  @ApiResponse({ status: 200, description: 'Feature prompt dismissed' })
  dismissPrompt(
    @UserId() userId: string,
    @Body() body: { featureId: string },
  ) {
    return this.onboardingService.dismissFeaturePrompt(userId, body.featureId);
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  @Post('verify-email/send')
  @ApiOperation({ summary: 'Send verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  sendVerificationEmail(@UserId() userId: string) {
    return this.onboardingService.sendVerificationEmail(userId);
  }

  @Post('verify-email/resend')
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email resent' })
  resendVerificationEmail(@UserId() userId: string) {
    return this.onboardingService.resendVerificationEmail(userId);
  }

  @Get('verify-email')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verification result' })
  verifyEmail(@Query('token') token: string) {
    return this.onboardingService.verifyEmail(token);
  }
}

