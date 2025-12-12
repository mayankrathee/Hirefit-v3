import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { DocumentParserService } from '../ai/services/document-parser.service';
import { ResumeScoringAgentService } from '../ai/services/resume-scoring-agent.service';
import { QueuePublisherService } from '../ai/services/queue-publisher.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

interface UploadResumeDto {
  originalFileName: string;
  fileType: string;
  fileSizeBytes: number;
  buffer: Buffer;
}

@Injectable()
export class ResumeProcessingService {
  private readonly logger = new Logger(ResumeProcessingService.name);
  private readonly uploadDir: string;
  private readonly aiProvider: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private usageService: UsageService,
    private documentParser: DocumentParserService,
    private resumeScoringAgent: ResumeScoringAgentService,
    private queuePublisher: QueuePublisherService,
  ) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || path.join(process.cwd(), 'uploads', 'resumes');
    this.aiProvider = this.configService.get('AI_PROVIDER', 'mock');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  /**
   * Upload a resume for a job and trigger AI processing
   */
  async uploadAndProcess(
    tenantId: string,
    userId: string,
    jobId: string,
    file: UploadResumeDto,
  ) {
    // Check AI score limit before processing
    const aiLimitCheck = await this.usageService.checkAiScoreLimit(tenantId);
    if (!aiLimitCheck.allowed) {
      throw new ForbiddenException(aiLimitCheck.reason);
    }

    // Check candidate limit
    await this.usageService.enforceCandidateLimit(tenantId);

    // Verify job exists
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Generate storage path
    const fileId = uuidv4();
    const extension = this.getExtension(file.originalFileName);
    const storagePath = `${tenantId}/jobs/${jobId}/${fileId}.${extension}`;

    // Save file to disk
    await this.saveFile(storagePath, file.buffer);

    // Create resume record (without candidate initially)
    const resume = await this.prisma.resume.create({
      data: {
        tenantId,
        jobId,
        uploadedById: userId,
        originalFileName: file.originalFileName,
        storagePath,
        fileType: file.fileType,
        fileSizeBytes: file.fileSizeBytes,
        processingStatus: 'processing',
        isPrimary: true,
      },
    });

    this.logger.log(`Uploaded resume ${resume.id} for job ${jobId}, starting processing...`);

    // Process based on AI provider configuration
    if (this.queuePublisher.isQueueEnabled()) {
      // Foundry mode: Enqueue for async processing via Service Bus
      await this.queuePublisher.enqueueResumeProcessing({
        resumeId: resume.id,
        jobId,
        tenantId,
        userId,
        storagePath,
        originalFileName: file.originalFileName,
        fileType: file.fileType,
      });

      this.logger.log(`Resume ${resume.id} enqueued for async processing`);
    } else {
      // Mock mode: Process immediately using setImmediate
      setImmediate(() => {
        this.processResumeDirectly(resume.id, jobId, tenantId, userId, file.buffer, file.originalFileName, file.fileType)
          .catch(err => {
            this.logger.error(`Failed to process resume ${resume.id}: ${err.message}`);
          });
      });
    }

    return {
      resumeId: resume.id,
      fileName: file.originalFileName,
      status: 'processing',
      message: this.queuePublisher.isQueueEnabled()
        ? 'Resume uploaded and queued for AI evaluation'
        : 'Resume uploaded and processing started',
      provider: this.aiProvider,
    };
  }

  /**
   * Process a resume directly (for mock mode or direct invocation)
   */
  async processResumeDirectly(
    resumeId: string,
    jobId: string,
    tenantId: string,
    userId: string,
    buffer: Buffer,
    originalFileName: string,
    fileType: string,
  ) {
    try {
      // Parse document
      const parseResult = await this.documentParser.parseDocument(buffer, originalFileName, fileType);

      // Process with scoring agent
      await this.resumeScoringAgent.processResume(
        resumeId,
        jobId,
        tenantId,
        userId,
        parseResult.text,
      );

      // Increment AI score usage (handled by scoring agent, but also track at tenant level)
      await this.usageService.incrementAiScoreUsage(tenantId);

      this.logger.log(`Completed direct processing of resume ${resumeId}`);
    } catch (error) {
      this.logger.error(`Error processing resume ${resumeId}: ${error.message}`);

      // Update resume with error status
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          processingStatus: 'failed',
          processingError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Get processing status for all resumes uploaded to a job
   */
  async getJobProcessingStatus(tenantId: string, jobId: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { tenantId, jobId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scores: {
          where: { jobId },
          take: 1,
        },
      },
    });

    return resumes.map(resume => ({
      resumeId: resume.id,
      fileName: resume.originalFileName,
      status: resume.processingStatus,
      error: resume.processingError,
      uploadedAt: resume.uploadedAt,
      processedAt: resume.processedAt,
      candidate: resume.candidate,
      score: resume.scores[0]?.overallScore || null,
    }));
  }

  /**
   * Retry processing a failed resume
   */
  async retryProcessing(
    tenantId: string,
    userId: string,
    resumeId: string,
  ) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, tenantId },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (resume.processingStatus !== 'failed') {
      throw new ForbiddenException('Can only retry failed resumes');
    }

    // Reset status
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        processingStatus: 'processing',
        processingError: null,
      },
    });

    // Load file from storage
    const filePath = path.join(this.uploadDir, resume.storagePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Resume file not found');
    }

    const buffer = await fs.promises.readFile(filePath);

    // Re-process
    if (this.queuePublisher.isQueueEnabled()) {
      await this.queuePublisher.enqueueResumeProcessing({
        resumeId: resume.id,
        jobId: resume.jobId!,
        tenantId,
        userId,
        storagePath: resume.storagePath,
        originalFileName: resume.originalFileName,
        fileType: resume.fileType,
      });
    } else {
      setImmediate(() => {
        this.processResumeDirectly(
          resume.id,
          resume.jobId!,
          tenantId,
          userId,
          buffer,
          resume.originalFileName,
          resume.fileType,
        ).catch(err => {
          this.logger.error(`Retry failed for resume ${resumeId}: ${err.message}`);
        });
      });
    }

    return {
      resumeId,
      status: 'processing',
      message: 'Resume re-queued for processing',
    };
  }

  /**
   * Get AI provider status
   */
  async getAIStatus() {
    const providerHealth = await this.resumeScoringAgent.getProviderHealth();
    const queueHealth = await this.queuePublisher.healthCheck();

    return {
      configuredProvider: this.aiProvider,
      activeProvider: providerHealth.provider,
      status: providerHealth.status,
      details: providerHealth.details,
      queue: queueHealth,
    };
  }

  /**
   * Utility: Get file extension
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
  }

  /**
   * Utility: Save file to disk
   */
  private async saveFile(storagePath: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);
    this.logger.log(`Saved file to: ${fullPath}`);
  }
}
