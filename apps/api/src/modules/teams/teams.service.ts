import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

export interface InviteTeamMemberDto {
  email: string;
  role: string;
  personalMessage?: string;
}

export interface UpdateTeamMemberRoleDto {
  role: string;
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
  }

  // ============================================================================
  // TEAM MEMBER MANAGEMENT
  // ============================================================================

  async getTeamMembers(tenantId: string) {
    const members = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return {
      members,
      count: members.length,
    };
  }

  async getTeamMemberById(tenantId: string, userId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        timezone: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            createdJobs: true,
            createdCandidates: true,
            evaluations: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async updateMemberRole(tenantId: string, userId: string, dto: UpdateTeamMemberRoleDto, currentUserId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    // Cannot change own role
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Validate role
    const validRoles = ['tenant_admin', 'hr_admin', 'recruiter', 'hiring_manager', 'viewer'];
    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException('Invalid role');
    }

    const updatedMember = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Log activity
    await this.logActivity(tenantId, currentUserId, 'UPDATE', 'users', userId, {
      oldRole: member.role,
      newRole: dto.role,
    });

    this.logger.log(`Updated role for ${member.email} from ${member.role} to ${dto.role}`);

    return updatedMember;
  }

  async removeMember(tenantId: string, userId: string, currentUserId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    // Cannot remove self
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot remove yourself from the team');
    }

    // Check if this is the last admin
    if (member.role === 'tenant_admin') {
      const adminCount = await this.prisma.user.count({
        where: { tenantId, role: 'tenant_admin', isActive: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last admin. Transfer ownership first.');
      }
    }

    // Deactivate instead of delete (preserve audit trail)
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Log activity
    await this.logActivity(tenantId, currentUserId, 'DELETE', 'users', userId, {
      email: member.email,
      role: member.role,
    });

    this.logger.log(`Removed team member: ${member.email}`);

    return { success: true, message: 'Team member removed' };
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  async getPendingInvitations(tenantId: string) {
    const invitations = await this.prisma.tenantInvitation.findMany({
      where: {
        tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        resendCount: true,
        lastResentAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { invitations, count: invitations.length };
  }

  async inviteTeamMember(
    tenantId: string,
    inviterId: string,
    dto: InviteTeamMemberDto,
  ) {
    // Check team member limit
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentMemberCount = await this.prisma.user.count({
      where: { tenantId, isActive: true },
    });

    const pendingInvitationCount = await this.prisma.tenantInvitation.count({
      where: {
        tenantId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (currentMemberCount + pendingInvitationCount >= tenant.maxTeamMembers) {
      throw new ForbiddenException(
        `Team member limit reached (${tenant.maxTeamMembers}). Upgrade your plan to invite more members.`,
      );
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('This email is already a team member');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: dto.email.toLowerCase(),
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    // Get inviter details
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
    });

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await this.prisma.tenantInvitation.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        invitedById: inviterId,
        personalMessage: dto.personalMessage,
        token,
        expiresAt,
        status: 'pending',
      },
    });

    // Send invitation email
    const invitationUrl = `${this.appUrl}/invite/${token}`;
    await this.emailService.sendTeamInvitationEmail({
      email: dto.email,
      inviterName: `${inviter?.firstName || 'Someone'} ${inviter?.lastName || ''}`.trim(),
      teamName: tenant.name,
      role: dto.role,
      invitationUrl,
      personalMessage: dto.personalMessage,
      expiresAt,
    });

    // Log activity
    await this.logActivity(tenantId, inviterId, 'CREATE', 'tenant_invitations', invitation.id, {
      email: dto.email,
      role: dto.role,
    });

    this.logger.log(`Invitation sent to ${dto.email} for tenant ${tenant.name}`);

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async resendInvitation(tenantId: string, invitationId: string, currentUserId: string) {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId, status: 'pending' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const inviter = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    // Extend expiration
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update invitation
    await this.prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: {
        expiresAt: newExpiresAt,
        lastResentAt: new Date(),
        resendCount: { increment: 1 },
      },
    });

    // Resend email
    const invitationUrl = `${this.appUrl}/invite/${invitation.token}`;
    await this.emailService.sendTeamInvitationEmail({
      email: invitation.email,
      inviterName: `${inviter?.firstName || 'Someone'} ${inviter?.lastName || ''}`.trim(),
      teamName: tenant?.name || 'Team',
      role: invitation.role,
      invitationUrl,
      personalMessage: invitation.personalMessage || undefined,
      expiresAt: newExpiresAt,
    });

    this.logger.log(`Resent invitation to ${invitation.email}`);

    return { success: true, message: 'Invitation resent' };
  }

  async revokeInvitation(tenantId: string, invitationId: string, currentUserId: string) {
    const invitation = await this.prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId, status: 'pending' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.tenantInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });

    // Log activity
    await this.logActivity(tenantId, currentUserId, 'DELETE', 'tenant_invitations', invitationId, {
      email: invitation.email,
    });

    this.logger.log(`Revoked invitation for ${invitation.email}`);

    return { success: true, message: 'Invitation revoked' };
  }

  async acceptInvitation(token: string, userData: { firstName: string; lastName: string; externalId?: string }) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(`Invitation has already been ${invitation.status}`);
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.tenantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Create user and accept invitation in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          email: invitation.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: invitation.role,
          externalId: userData.externalId,
          emailVerified: true, // Invitation acceptance implies email is valid
          emailVerifiedAt: new Date(),
          isActive: true,
        },
      });

      // Update invitation
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        },
      });

      return user;
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      email: result.email,
      firstName: result.firstName,
      dashboardUrl: `${this.appUrl}/dashboard`,
    });

    // Log activity
    await this.logActivity(invitation.tenantId, result.id, 'CREATE', 'users', result.id, {
      source: 'invitation',
      invitationId: invitation.id,
    });

    this.logger.log(`User ${result.email} accepted invitation and joined ${invitation.tenant.name}`);

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
      },
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name,
        slug: invitation.tenant.slug,
      },
    };
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.tenantInvitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException(`Invitation has been ${invitation.status}`);
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      tenant: invitation.tenant,
      expiresAt: invitation.expiresAt,
    };
  }

  // ============================================================================
  // TEAM STATS
  // ============================================================================

  async getTeamStats(tenantId: string) {
    const [memberCount, invitationCount, tenant] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.tenantInvitation.count({
        where: { tenantId, status: 'pending', expiresAt: { gt: new Date() } },
      }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
    ]);

    return {
      members: memberCount,
      pendingInvitations: invitationCount,
      maxMembers: tenant?.maxTeamMembers || 1,
      slotsAvailable: (tenant?.maxTeamMembers || 1) - memberCount - invitationCount,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async logActivity(
    tenantId: string,
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log activity', error);
    }
  }
}

