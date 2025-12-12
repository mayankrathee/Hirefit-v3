import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ActivityQueryDto {
  page?: number;
  pageSize?: number;
  resource?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActivity(tenantId: string, query: ActivityQueryDto = {}): Promise<{
    items: ActivityEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);

    const where: any = {
      tenantId,
    };

    if (query.resource) {
      where.resource = query.resource;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) {
        where.timestamp.gte = query.startDate;
      }
      if (query.endDate) {
        where.timestamp.lte = query.endDate;
      }
    }

    const [activities, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: activities.map(a => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        resourceId: a.resourceId || undefined,
        user: a.user ? {
          id: a.user.id,
          firstName: a.user.firstName,
          lastName: a.user.lastName,
          avatarUrl: a.user.avatarUrl || undefined,
        } : undefined,
        metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
        timestamp: a.timestamp,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getRecentActivity(tenantId: string, limit: number = 10): Promise<ActivityEntry[]> {
    const activities = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        // Filter to interesting activities
        action: { in: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'] },
        resource: { in: ['jobs', 'candidates', 'applications', 'resumes', 'users', 'evaluations'] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return activities.map(a => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      resourceId: a.resourceId || undefined,
      user: a.user ? {
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        avatarUrl: a.user.avatarUrl || undefined,
      } : undefined,
      metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
      timestamp: a.timestamp,
    }));
  }

  async getUserActivity(tenantId: string, userId: string, limit: number = 20): Promise<ActivityEntry[]> {
    const activities = await this.prisma.auditLog.findMany({
      where: { tenantId, userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return activities.map(a => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      resourceId: a.resourceId || undefined,
      metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
      timestamp: a.timestamp,
    }));
  }

  async logActivity(
    tenantId: string,
    userId: string | null,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>,
    requestContext?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: requestContext?.ipAddress,
          userAgent: requestContext?.userAgent,
          requestId: requestContext?.requestId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log activity', error);
    }
  }

  formatActivityMessage(entry: ActivityEntry): string {
    const userName = entry.user
      ? `${entry.user.firstName} ${entry.user.lastName}`
      : 'Someone';

    const actionVerbs: Record<string, string> = {
      CREATE: 'created',
      UPDATE: 'updated',
      DELETE: 'deleted',
      LOGIN: 'logged in',
      UPLOAD: 'uploaded',
      SCORE: 'scored',
    };

    const resourceNames: Record<string, string> = {
      jobs: 'a job',
      candidates: 'a candidate',
      applications: 'an application',
      resumes: 'a resume',
      users: 'a team member',
      evaluations: 'an evaluation',
      tenant_invitations: 'an invitation',
    };

    const verb = actionVerbs[entry.action] || entry.action.toLowerCase();
    const resource = resourceNames[entry.resource] || entry.resource;

    // Add context from metadata
    let context = '';
    if (entry.metadata) {
      if (entry.metadata.title) {
        context = ` "${entry.metadata.title}"`;
      } else if (entry.metadata.email) {
        context = ` for ${entry.metadata.email}`;
      } else if (entry.metadata.name) {
        context = ` "${entry.metadata.name}"`;
      }
    }

    return `${userName} ${verb} ${resource}${context}`;
  }
}

