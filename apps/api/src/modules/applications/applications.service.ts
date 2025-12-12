import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateApplicationDto {
  candidateId: string;
  jobId: string;
  notes?: string;
}

export interface UpdateApplicationStatusDto {
  status: string;
  notes?: string;
  decisionReason?: string;
}

export interface MoveStageDto {
  stage: string;
}

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  private readonly validStatuses = [
    'new',
    'screening',
    'interviewing',
    'offer',
    'hired',
    'rejected',
    'withdrawn',
  ];

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateApplicationDto) {
    // Verify candidate belongs to tenant
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: dto.candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Verify job belongs to tenant and is open
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'open') {
      throw new BadRequestException('Job is not open for applications');
    }

    // Check if application already exists
    const existingApplication = await this.prisma.application.findFirst({
      where: { candidateId: dto.candidateId, jobId: dto.jobId },
    });

    if (existingApplication) {
      throw new ConflictException('Candidate has already applied to this job');
    }

    // Create application
    const application = await this.prisma.application.create({
      data: {
        candidateId: dto.candidateId,
        jobId: dto.jobId,
        status: 'new',
        notes: dto.notes,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    });

    this.logger.log(
      `Created application ${application.id} for candidate ${dto.candidateId} to job ${dto.jobId}`,
    );

    return application;
  }

  async findAll(
    tenantId: string,
    options: {
      jobId?: string;
      candidateId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const { jobId, candidateId, status, page = 1, pageSize = 20 } = options;

    const where: any = {};

    if (jobId) {
      // Verify job belongs to tenant
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, tenantId },
      });
      if (!job) {
        throw new NotFoundException('Job not found');
      }
      where.jobId = jobId;
    }

    if (candidateId) {
      // Verify candidate belongs to tenant
      const candidate = await this.prisma.candidate.findFirst({
        where: { id: candidateId, tenantId },
      });
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }
      where.candidateId = candidateId;
    }

    // If neither filter, require tenant-level access
    if (!jobId && !candidateId) {
      // Get all applications for jobs in this tenant
      where.job = { tenantId };
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              department: true,
              location: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(tenantId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        job: { tenantId },
      },
      include: {
        candidate: {
          include: {
            resumes: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        job: true,
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.findById(tenantId, id);

    if (!this.validStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status. Valid statuses: ${this.validStatuses.join(', ')}`,
      );
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    // Track decision for terminal states
    if (['hired', 'rejected', 'withdrawn'].includes(dto.status)) {
      updateData.decision =
        dto.status === 'hired'
          ? 'hire'
          : dto.status === 'rejected'
            ? 'reject'
            : 'withdrawn';
      updateData.decisionBy = userId;
      updateData.decisionAt = new Date();
      updateData.decisionReason = dto.decisionReason;
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: updateData,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    });

    this.logger.log(
      `Updated application ${id} status to ${dto.status} by user ${userId}`,
    );

    return updated;
  }

  async moveStage(tenantId: string, id: string, dto: MoveStageDto) {
    const application = await this.findById(tenantId, id);

    const updated = await this.prisma.application.update({
      where: { id },
      data: { stage: dto.stage },
    });

    this.logger.log(`Moved application ${id} to stage: ${dto.stage}`);

    return updated;
  }

  async getStats(tenantId: string, jobId?: string) {
    const where: any = {
      job: { tenantId },
    };

    if (jobId) {
      where.jobId = jobId;
    }

    const statusCounts = await this.prisma.application.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const stats = {
      total: 0,
      new: 0,
      screening: 0,
      interviewing: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const item of statusCounts) {
      stats[item.status as keyof typeof stats] = item._count;
      stats.total += item._count;
    }

    return stats;
  }

  async delete(tenantId: string, id: string) {
    const application = await this.findById(tenantId, id);

    await this.prisma.application.delete({ where: { id } });

    this.logger.log(`Deleted application ${id}`);
  }
}

