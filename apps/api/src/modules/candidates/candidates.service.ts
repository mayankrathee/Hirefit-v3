import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto, UpdateCandidateDto, CandidateQueryDto } from './dto/candidate.dto';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, createCandidateDto: CreateCandidateDto) {
    // Check if candidate with email already exists in tenant
    const existingCandidate = await this.prisma.candidate.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: createCandidateDto.email.toLowerCase(),
        },
      },
    });

    if (existingCandidate) {
      throw new ConflictException('Candidate with this email already exists');
    }

    const candidate = await this.prisma.candidate.create({
      data: {
        tenantId,
        createdById: userId,
        email: createCandidateDto.email.toLowerCase(),
        firstName: createCandidateDto.firstName,
        lastName: createCandidateDto.lastName,
        phone: createCandidateDto.phone,
        city: createCandidateDto.city,
        state: createCandidateDto.state,
        country: createCandidateDto.country,
        linkedInUrl: createCandidateDto.linkedInUrl,
        websiteUrl: createCandidateDto.websiteUrl,
        source: createCandidateDto.source,
        sourceDetails: createCandidateDto.sourceDetails,
        tags: JSON.stringify(createCandidateDto.tags || []),
      },
    });

    this.logger.log(`Created candidate: ${candidate.email} (${candidate.id})`);
    return candidate;
  }

  async findAll(tenantId: string, query: CandidateQueryDto) {
    const where: any = { tenantId, isActive: true };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.source) {
      where.source = query.source;
    }

    const [candidates, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: ((query.page || 1) - 1) * (query.pageSize || 20),
        take: query.pageSize || 20,
        include: {
          resumes: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              applications: true,
              resumes: true,
            },
          },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      items: candidates,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }

  async findById(tenantId: string, id: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id, tenantId },
      include: {
        resumes: {
          orderBy: { uploadedAt: 'desc' },
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                department: true,
                status: true,
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return candidate;
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.candidate.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase(),
        },
      },
    });
  }

  async update(tenantId: string, id: string, updateCandidateDto: UpdateCandidateDto) {
    await this.findById(tenantId, id);

    const data: any = { ...updateCandidateDto };
    if (updateCandidateDto.tags) {
      data.tags = JSON.stringify(updateCandidateDto.tags);
    }

    return this.prisma.candidate.update({
      where: { id },
      data,
    });
  }

  async addTags(tenantId: string, id: string, tags: string[]) {
    const candidate = await this.findById(tenantId, id);
    const currentTags: string[] = JSON.parse(candidate.tags || '[]');
    const uniqueTags = [...new Set([...currentTags, ...tags])];

    return this.prisma.candidate.update({
      where: { id },
      data: { tags: JSON.stringify(uniqueTags) },
    });
  }

  async removeTags(tenantId: string, id: string, tags: string[]) {
    const candidate = await this.findById(tenantId, id);
    const currentTags: string[] = JSON.parse(candidate.tags || '[]');
    const filteredTags = currentTags.filter((t) => !tags.includes(t));

    return this.prisma.candidate.update({
      where: { id },
      data: { tags: JSON.stringify(filteredTags) },
    });
  }

  async deactivate(tenantId: string, id: string) {
    await this.findById(tenantId, id);

    return this.prisma.candidate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(tenantId: string) {
    const [total, thisMonth, bySource] = await Promise.all([
      this.prisma.candidate.count({ where: { tenantId } }),
      this.prisma.candidate.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.candidate.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: { source: true },
      }),
    ]);

    return {
      total,
      thisMonth,
      bySource: bySource.map((s) => ({
        source: s.source || 'Unknown',
        count: s._count.source,
      })),
    };
  }
}

