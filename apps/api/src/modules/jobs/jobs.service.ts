import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, UpdateJobDto, JobQueryDto } from './dto/job.dto';
import { UsageService } from '../usage/usage.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
  ) {}

  async create(tenantId: string, userId: string, createJobDto: CreateJobDto) {
    // Check job limit before creating
    await this.usageService.enforceJobLimit(tenantId);
    const job = await this.prisma.job.create({
      data: {
        tenantId,
        createdById: userId,
        title: createJobDto.title,
        description: createJobDto.description,
        department: createJobDto.department,
        location: createJobDto.location,
        locationType: createJobDto.locationType || 'onsite',
        requirements: JSON.stringify(createJobDto.requirements || {}),
        salaryMin: createJobDto.salaryMin,
        salaryMax: createJobDto.salaryMax,
        salaryCurrency: createJobDto.salaryCurrency || 'USD',
        employmentType: createJobDto.employmentType || 'full_time',
        scoringRubric: JSON.stringify(createJobDto.scoringRubric || {}),
        pipelineStages: JSON.stringify(createJobDto.pipelineStages || [
          'new',
          'screening',
          'interview',
          'offer',
          'hired',
        ]),
        status: 'draft',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Created job: ${job.title} (${job.id})`);
    return job;
  }

  async findAll(tenantId: string, query: JobQueryDto) {
    const where: any = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.department) {
      where.department = query.department;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.pageSize || 20),
        take: query.pageSize || 20,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items: jobs,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }

  async findById(tenantId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, tenantId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(tenantId: string, id: string, updateJobDto: UpdateJobDto) {
    await this.findById(tenantId, id);

    const data: any = { ...updateJobDto };
    if (updateJobDto.requirements) {
      data.requirements = JSON.stringify(updateJobDto.requirements);
    }
    if (updateJobDto.scoringRubric) {
      data.scoringRubric = JSON.stringify(updateJobDto.scoringRubric);
    }
    if (updateJobDto.pipelineStages) {
      data.pipelineStages = JSON.stringify(updateJobDto.pipelineStages);
    }

    return this.prisma.job.update({
      where: { id },
      data,
    });
  }

  async publish(tenantId: string, id: string) {
    const job = await this.findById(tenantId, id);

    if (job.status !== 'draft' && job.status !== 'paused') {
      throw new Error('Only draft or paused jobs can be published');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'open',
        publishedAt: new Date(),
      },
    });
  }

  async pause(tenantId: string, id: string) {
    const job = await this.findById(tenantId, id);

    if (job.status !== 'open') {
      throw new Error('Only open jobs can be paused');
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: 'paused' },
    });
  }

  async close(tenantId: string, id: string, reason?: string) {
    await this.findById(tenantId, id);

    return this.prisma.job.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
      },
    });
  }

  async getStats(tenantId: string) {
    const [total, open, draft, closed] = await Promise.all([
      this.prisma.job.count({ where: { tenantId } }),
      this.prisma.job.count({ where: { tenantId, status: 'open' } }),
      this.prisma.job.count({ where: { tenantId, status: 'draft' } }),
      this.prisma.job.count({ where: { tenantId, status: 'closed' } }),
    ]);

    return { total, open, draft, closed };
  }

  async delete(tenantId: string, id: string) {
    const job = await this.findById(tenantId, id);

    // Only allow deletion of draft jobs
    if (job.status !== 'draft') {
      throw new Error('Only draft jobs can be deleted');
    }

    await this.prisma.job.delete({ where: { id } });
    this.logger.log(`Deleted job: ${id}`);
  }
}

