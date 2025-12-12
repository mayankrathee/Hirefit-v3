import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

// Onboarding steps in order
export const ONBOARDING_STEPS = [
  'welcome',
  'profile',
  'first_job',
  'first_candidate',
  'complete',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
  percentComplete: number;
  nextAction?: {
    title: string;
    description: string;
    actionUrl: string;
  };
}

export interface FeatureDiscoveryState {
  [featureId: string]: {
    discovered: boolean;
    dismissed: boolean;
    discoveredAt?: Date;
  };
}

// Feature discovery prompts
export const FEATURE_PROMPTS = {
  ai_scoring: {
    id: 'ai_scoring',
    title: 'AI Resume Scoring',
    description: 'Let AI analyze and score resumes against your job requirements.',
    triggerAfter: 'first_job', // Show after first job is created
    actionUrl: '/dashboard/jobs',
  },
  bulk_upload: {
    id: 'bulk_upload',
    title: 'Bulk Upload Resumes',
    description: 'Upload multiple resumes at once to speed up your hiring process.',
    triggerAfter: 'first_candidate',
    actionUrl: '/dashboard/jobs',
  },
  team_collaboration: {
    id: 'team_collaboration',
    title: 'Invite Your Team',
    description: 'Collaborate with your team on hiring decisions.',
    triggerAfter: 'first_candidate',
    actionUrl: '/dashboard/settings/team',
  },
} as const;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
  }

  // ============================================================================
  // ONBOARDING PROGRESS
  // ============================================================================

  async getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            jobs: { take: 1 },
            candidates: { take: 1 },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate completed steps based on actual data
    const completedSteps: OnboardingStep[] = ['welcome'];

    // Profile is complete if user has basic info
    if (user.firstName && user.lastName) {
      completedSteps.push('profile');
    }

    // Check for first job
    if (user.tenant.jobs.length > 0) {
      completedSteps.push('first_job');
    }

    // Check for first candidate
    if (user.tenant.candidates.length > 0) {
      completedSteps.push('first_candidate');
    }

    // Determine current step
    let currentStep: OnboardingStep = 'welcome';
    for (const step of ONBOARDING_STEPS) {
      if (!completedSteps.includes(step)) {
        currentStep = step;
        break;
      }
    }

    // If all steps completed
    if (completedSteps.length >= ONBOARDING_STEPS.length - 1) {
      currentStep = 'complete';
      completedSteps.push('complete');
    }

    const isComplete = currentStep === 'complete' || user.onboardingComplete;
    const percentComplete = Math.round(
      (completedSteps.length / ONBOARDING_STEPS.length) * 100,
    );

    // Determine next action
    const nextAction = this.getNextAction(currentStep);

    return {
      currentStep,
      completedSteps,
      isComplete,
      percentComplete,
      nextAction,
    };
  }

  async updateOnboardingStep(userId: string, step: OnboardingStep): Promise<OnboardingProgress> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: step,
        onboardingComplete: step === 'complete',
      },
    });

    return this.getOnboardingProgress(userId);
  }

  async completeOnboarding(userId: string): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: 'complete',
        onboardingComplete: true,
      },
    });

    return { success: true };
  }

  async dismissOnboarding(userId: string): Promise<{ success: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingDismissed: true,
      },
    });

    return { success: true };
  }

  // ============================================================================
  // FEATURE DISCOVERY
  // ============================================================================

  async getFeatureDiscoveryState(userId: string): Promise<FeatureDiscoveryState> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return JSON.parse(user.featureDiscovery || '{}');
  }

  async getActiveFeaturePrompts(userId: string): Promise<typeof FEATURE_PROMPTS[keyof typeof FEATURE_PROMPTS][]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    const discoveryState: FeatureDiscoveryState = JSON.parse(user.featureDiscovery || '{}');
    const onboardingProgress = await this.getOnboardingProgress(userId);
    const activePrompts: typeof FEATURE_PROMPTS[keyof typeof FEATURE_PROMPTS][] = [];

    for (const [key, prompt] of Object.entries(FEATURE_PROMPTS)) {
      const state = discoveryState[key];

      // Skip if already discovered or dismissed
      if (state?.discovered || state?.dismissed) {
        continue;
      }

      // Check if trigger condition is met
      if (
        prompt.triggerAfter &&
        onboardingProgress.completedSteps.includes(prompt.triggerAfter as OnboardingStep)
      ) {
        activePrompts.push(prompt);
      }
    }

    return activePrompts;
  }

  async markFeatureDiscovered(userId: string, featureId: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const discoveryState: FeatureDiscoveryState = JSON.parse(user.featureDiscovery || '{}');

    discoveryState[featureId] = {
      ...(discoveryState[featureId] || {}),
      discovered: true,
      discoveredAt: new Date(),
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        featureDiscovery: JSON.stringify(discoveryState),
      },
    });

    return { success: true };
  }

  async dismissFeaturePrompt(userId: string, featureId: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const discoveryState: FeatureDiscoveryState = JSON.parse(user.featureDiscovery || '{}');

    discoveryState[featureId] = {
      ...(discoveryState[featureId] || {}),
      dismissed: true,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        featureDiscovery: JSON.stringify(discoveryState),
      },
    });

    return { success: true };
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  async sendVerificationEmail(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });

    // Send email
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      verificationUrl,
    });

    this.logger.log(`Verification email sent to ${user.email}`);

    return { success: true, message: 'Verification email sent' };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired verification token' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      email: user.email,
      firstName: user.firstName,
      dashboardUrl: `${this.appUrl}/dashboard`,
    });

    this.logger.log(`Email verified for ${user.email}`);

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string): Promise<{ success: boolean; message: string }> {
    return this.sendVerificationEmail(userId);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getNextAction(step: OnboardingStep): OnboardingProgress['nextAction'] | undefined {
    const actions: Record<OnboardingStep, OnboardingProgress['nextAction'] | undefined> = {
      welcome: {
        title: 'Complete Your Profile',
        description: 'Add your name and preferences to get started.',
        actionUrl: '/dashboard/settings',
      },
      profile: {
        title: 'Create Your First Job',
        description: 'Post a job to start receiving and evaluating candidates.',
        actionUrl: '/dashboard/jobs/new',
      },
      first_job: {
        title: 'Upload Your First Resume',
        description: 'Upload a resume to see AI-powered candidate scoring in action.',
        actionUrl: '/dashboard/jobs',
      },
      first_candidate: {
        title: 'Explore More Features',
        description: 'Discover more ways to streamline your hiring process.',
        actionUrl: '/dashboard',
      },
      complete: undefined,
    };

    return actions[step];
  }
}

