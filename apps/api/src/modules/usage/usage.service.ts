import {
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UsageStats {
  // Current usage
  activeJobs: number;
  totalCandidates: number;
  aiScoresThisMonth: number;
  teamMembers: number;
  
  // Limits
  maxJobs: number;
  maxCandidates: number;
  maxAiScoresPerMonth: number;
  maxTeamMembers: number;
  
  // Percentages
  jobsPercent: number;
  candidatesPercent: number;
  aiScoresPercent: number;
  teamPercent: number;
  
  // Workspace info
  workspaceType: 'personal' | 'company';
  subscriptionTier: string;
  
  // Warnings
  warnings: string[];
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  percentUsed: number;
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get usage statistics for a tenant
   */
  async getUsageStats(tenantId: string): Promise<UsageStats> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Reset monthly usage if needed
    await this.checkAndResetMonthlyUsage(tenantId);

    // Get current counts
    const [activeJobs, totalCandidates, teamMembers] = await Promise.all([
      this.prisma.job.count({
        where: { tenantId, status: { in: ['draft', 'open', 'paused'] } },
      }),
      this.prisma.candidate.count({
        where: { tenantId },
      }),
      this.prisma.user.count({
        where: { tenantId, isActive: true },
      }),
    ]);

    // Re-fetch tenant to get updated monthly usage
    const updatedTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const aiScoresThisMonth = updatedTenant?.aiScoresUsedThisMonth || 0;

    // Calculate percentages
    const jobsPercent = Math.round((activeJobs / tenant.maxJobs) * 100);
    const candidatesPercent = Math.round((totalCandidates / tenant.maxCandidates) * 100);
    const aiScoresPercent = Math.round((aiScoresThisMonth / tenant.maxAiScoresPerMonth) * 100);
    const teamPercent = Math.round((teamMembers / tenant.maxTeamMembers) * 100);

    // Generate warnings
    const warnings: string[] = [];
    if (jobsPercent >= 80) warnings.push(`You've used ${jobsPercent}% of your job posting limit`);
    if (candidatesPercent >= 80) warnings.push(`You've used ${candidatesPercent}% of your candidate limit`);
    if (aiScoresPercent >= 80) warnings.push(`You've used ${aiScoresPercent}% of your AI scores this month`);
    if (teamPercent >= 100 && tenant.type === 'personal') warnings.push('Upgrade to add team members');

    return {
      activeJobs,
      totalCandidates,
      aiScoresThisMonth,
      teamMembers,
      
      maxJobs: tenant.maxJobs,
      maxCandidates: tenant.maxCandidates,
      maxAiScoresPerMonth: tenant.maxAiScoresPerMonth,
      maxTeamMembers: tenant.maxTeamMembers,
      
      jobsPercent: Math.min(jobsPercent, 100),
      candidatesPercent: Math.min(candidatesPercent, 100),
      aiScoresPercent: Math.min(aiScoresPercent, 100),
      teamPercent: Math.min(teamPercent, 100),
      
      workspaceType: tenant.type as 'personal' | 'company',
      subscriptionTier: tenant.subscriptionTier,
      
      warnings,
    };
  }

  /**
   * Check if a new job can be created
   */
  async checkJobLimit(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const activeJobs = await this.prisma.job.count({
      where: { tenantId, status: { in: ['draft', 'open', 'paused'] } },
    });

    const allowed = activeJobs < tenant!.maxJobs;
    const percentUsed = Math.round((activeJobs / tenant!.maxJobs) * 100);

    return {
      allowed,
      reason: allowed ? undefined : `Job limit reached (${tenant!.maxJobs} jobs). Upgrade your plan for more.`,
      currentUsage: activeJobs,
      limit: tenant!.maxJobs,
      percentUsed,
    };
  }

  /**
   * Check if a new candidate can be added
   */
  async checkCandidateLimit(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const totalCandidates = await this.prisma.candidate.count({
      where: { tenantId },
    });

    const allowed = totalCandidates < tenant!.maxCandidates;
    const percentUsed = Math.round((totalCandidates / tenant!.maxCandidates) * 100);

    return {
      allowed,
      reason: allowed ? undefined : `Candidate limit reached (${tenant!.maxCandidates} candidates). Upgrade your plan for more.`,
      currentUsage: totalCandidates,
      limit: tenant!.maxCandidates,
      percentUsed,
    };
  }

  /**
   * Check if an AI score can be used
   */
  async checkAiScoreLimit(tenantId: string): Promise<LimitCheckResult> {
    await this.checkAndResetMonthlyUsage(tenantId);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const aiScoresUsed = tenant!.aiScoresUsedThisMonth;
    const allowed = aiScoresUsed < tenant!.maxAiScoresPerMonth;
    const percentUsed = Math.round((aiScoresUsed / tenant!.maxAiScoresPerMonth) * 100);

    return {
      allowed,
      reason: allowed ? undefined : `AI score limit reached (${tenant!.maxAiScoresPerMonth}/month). Resets on the 1st. Upgrade for more.`,
      currentUsage: aiScoresUsed,
      limit: tenant!.maxAiScoresPerMonth,
      percentUsed,
    };
  }

  /**
   * Check if a team member can be added
   */
  async checkTeamMemberLimit(tenantId: string): Promise<LimitCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const teamMembers = await this.prisma.user.count({
      where: { tenantId, isActive: true },
    });

    const allowed = teamMembers < tenant!.maxTeamMembers;
    const percentUsed = Math.round((teamMembers / tenant!.maxTeamMembers) * 100);

    return {
      allowed,
      reason: allowed ? undefined : `Team member limit reached (${tenant!.maxTeamMembers} users). Upgrade your plan for more.`,
      currentUsage: teamMembers,
      limit: tenant!.maxTeamMembers,
      percentUsed,
    };
  }

  /**
   * Increment AI score usage
   */
  async incrementAiScoreUsage(tenantId: string): Promise<void> {
    await this.checkAndResetMonthlyUsage(tenantId);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiScoresUsedThisMonth: { increment: 1 },
      },
    });

    this.logger.debug(`Incremented AI score usage for tenant ${tenantId}`);
  }

  /**
   * Enforce job limit (throws if exceeded)
   */
  async enforceJobLimit(tenantId: string): Promise<void> {
    const check = await this.checkJobLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }
  }

  /**
   * Enforce candidate limit (throws if exceeded)
   */
  async enforceCandidateLimit(tenantId: string): Promise<void> {
    const check = await this.checkCandidateLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }
  }

  /**
   * Enforce AI score limit (throws if exceeded)
   */
  async enforceAiScoreLimit(tenantId: string): Promise<void> {
    const check = await this.checkAiScoreLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }
  }

  /**
   * Enforce team member limit (throws if exceeded)
   */
  async enforceTeamMemberLimit(tenantId: string): Promise<void> {
    const check = await this.checkTeamMemberLimit(tenantId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }
  }

  /**
   * Check and reset monthly usage if needed
   */
  private async checkAndResetMonthlyUsage(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return;

    const now = new Date();
    const resetDate = new Date(tenant.usageResetDate);

    // Check if we're in a new month
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      // Reset monthly usage
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          aiScoresUsedThisMonth: 0,
          usageResetDate: new Date(now.getFullYear(), now.getMonth(), 1), // First of current month
        },
      });

      this.logger.log(`Reset monthly usage for tenant ${tenantId}`);
    }
  }

  /**
   * Get pricing tiers for upgrade display
   */
  getPricingTiers() {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        priceLabel: '$0/mo',
        description: 'For individual HR professionals',
        limits: {
          maxJobs: 3,
          maxCandidates: 50,
          maxAiScoresPerMonth: 20,
          maxTeamMembers: 1,
        },
        features: [
          '3 active job postings',
          '50 candidates',
          '20 AI resume scores/month',
          'Unlimited resume uploads',
          'Basic support',
        ],
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        priceLabel: '$29/mo',
        description: 'For growing professionals',
        limits: {
          maxJobs: 10,
          maxCandidates: 500,
          maxAiScoresPerMonth: 100,
          maxTeamMembers: 1,
        },
        features: [
          '10 active job postings',
          '500 candidates',
          '100 AI resume scores/month',
          'Advanced analytics',
          'Priority support',
        ],
        popular: true,
      },
      {
        id: 'team',
        name: 'Team',
        price: 79,
        priceLabel: '$79/mo',
        description: 'For small teams',
        limits: {
          maxJobs: 50,
          maxCandidates: 2000,
          maxAiScoresPerMonth: 500,
          maxTeamMembers: 5,
        },
        features: [
          'Unlimited job postings',
          '2,000 candidates',
          '500 AI resume scores/month',
          'Up to 5 team members',
          'Team collaboration',
          'Advanced analytics',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        priceLabel: 'Custom',
        description: 'For large organizations',
        limits: {
          maxJobs: -1, // Unlimited
          maxCandidates: -1,
          maxAiScoresPerMonth: -1,
          maxTeamMembers: -1,
        },
        features: [
          'Unlimited everything',
          'SSO integration',
          'API access',
          'Custom integrations',
          'Dedicated support',
          'SLA guarantee',
        ],
      },
    ];
  }
}

