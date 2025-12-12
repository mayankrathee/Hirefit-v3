import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// Types for resume processing
interface UploadResumeDto {
  candidateId: string;
  originalFileName: string;
  fileType: string;
  fileSizeBytes: number;
  buffer: Buffer;
}

interface ParsedResumeData {
  contact: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  experience: Array<{
    company: string;
    title: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    field?: string;
    endDate?: Date;
  }>;
  skills: string[];
  summary?: string;
}

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private readonly allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly uploadDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Set up local storage directory
    this.uploadDir = this.configService.get('UPLOAD_DIR') || path.join(process.cwd(), 'uploads', 'resumes');
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async upload(tenantId: string, uploadDto: UploadResumeDto) {
    // Validate file type
    if (!this.allowedTypes.includes(uploadDto.fileType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedTypes.join(', ')}`,
      );
    }

    // Validate file size
    if (uploadDto.fileSizeBytes > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Verify candidate belongs to tenant
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: uploadDto.candidateId, tenantId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Generate storage path
    const fileId = uuidv4();
    const extension = this.getExtension(uploadDto.originalFileName);
    const storagePath = `${tenantId}/${uploadDto.candidateId}/${fileId}.${extension}`;

    // Save file locally (development) or to Azure Blob (production)
    await this.saveFile(storagePath, uploadDto.buffer);

    // Create resume record
    const resume = await this.prisma.resume.create({
      data: {
        tenantId,
        candidateId: uploadDto.candidateId,
        originalFileName: uploadDto.originalFileName,
        storagePath,
        fileType: uploadDto.fileType,
        fileSizeBytes: uploadDto.fileSizeBytes,
        processingStatus: 'pending',
        isPrimary: false,
      },
    });

    // Check if this is the first resume - make it primary
    const resumeCount = await this.prisma.resume.count({
      where: { candidateId: uploadDto.candidateId },
    });

    if (resumeCount === 1) {
      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { isPrimary: true },
      });
    }

    this.logger.log(`Uploaded resume: ${resume.id} for candidate ${candidate.id}`);

    // TODO: Queue for processing via Service Bus
    // await this.serviceBusClient.send('resume-processing', { resumeId: resume.id });

    return resume;
  }

  async findById(candidateId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, candidateId },
      include: {
        scores: true,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  async findByCandidate(candidateId: string) {
    return this.prisma.resume.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: 'desc' },
      include: {
        scores: {
          orderBy: { scoredAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async setPrimary(candidateId: string, id: string) {
    // Verify resume exists
    const resume = await this.findById(candidateId, id);

    // Remove primary from all other resumes
    await this.prisma.resume.updateMany({
      where: { candidateId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this one as primary
    return this.prisma.resume.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async updateProcessingStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    error?: string,
  ) {
    const data: any = { processingStatus: status };

    if (status === 'completed') {
      data.processedAt = new Date();
    }

    if (error) {
      data.processingError = error;
    }

    return this.prisma.resume.update({
      where: { id },
      data,
    });
  }

  async saveParsedData(id: string, parsedData: ParsedResumeData, confidence: number) {
    return this.prisma.resume.update({
      where: { id },
      data: {
        parsedData: parsedData as any,
        parseConfidence: confidence,
        rawText: this.extractRawText(parsedData),
        processingStatus: 'completed',
        processedAt: new Date(),
      },
    });
  }

  async saveScore(
    resumeId: string,
    jobId: string,
    score: {
      overallScore: number;
      confidence: number;
      dimensionScores: Record<string, number>;
      explanation: any;
      modelVersion: string;
      rubricVersion: string;
    },
  ) {
    return this.prisma.resumeScore.upsert({
      where: {
        resumeId_jobId: { resumeId, jobId },
      },
      create: {
        resumeId,
        jobId,
        overallScore: score.overallScore,
        confidence: score.confidence,
        skillsMatchScore: score.dimensionScores.skillsMatch,
        experienceMatchScore: score.dimensionScores.experienceMatch,
        educationMatchScore: score.dimensionScores.educationMatch,
        certificationsScore: score.dimensionScores.certifications,
        locationScore: score.dimensionScores.location,
        overallFitScore: score.dimensionScores.overallFit,
        explanation: score.explanation,
        modelVersion: score.modelVersion,
        rubricVersion: score.rubricVersion,
      },
      update: {
        overallScore: score.overallScore,
        confidence: score.confidence,
        skillsMatchScore: score.dimensionScores.skillsMatch,
        experienceMatchScore: score.dimensionScores.experienceMatch,
        educationMatchScore: score.dimensionScores.educationMatch,
        certificationsScore: score.dimensionScores.certifications,
        locationScore: score.dimensionScores.location,
        overallFitScore: score.dimensionScores.overallFit,
        explanation: score.explanation,
        modelVersion: score.modelVersion,
        rubricVersion: score.rubricVersion,
        scoredAt: new Date(),
      },
    });
  }

  async getDownloadUrl(candidateId: string, id: string): Promise<string> {
    const resume = await this.findById(candidateId, id);

    // In production, this would generate a SAS URL from Azure Blob Storage
    // For now, return the API endpoint for serving the file
    return `/api/candidates/${candidateId}/resumes/${id}/file`;
  }

  async getFilePath(candidateId: string, id: string): Promise<{ filePath: string; fileName: string; mimeType: string }> {
    const resume = await this.findById(candidateId, id);
    const fullPath = path.join(this.uploadDir, resume.storagePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Resume file not found on disk');
    }

    return {
      filePath: fullPath,
      fileName: resume.originalFileName,
      mimeType: resume.fileType,
    };
  }

  private async saveFile(storagePath: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    await fs.promises.writeFile(fullPath, buffer);
    this.logger.log(`Saved file to: ${fullPath}`);
  }

  private async deleteFile(storagePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, storagePath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      this.logger.log(`Deleted file: ${fullPath}`);
    }
  }

  async delete(candidateId: string, id: string) {
    const resume = await this.findById(candidateId, id);

    // Delete file from storage
    await this.deleteFile(resume.storagePath);

    await this.prisma.resume.delete({ where: { id } });
    this.logger.log(`Deleted resume: ${id}`);
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
  }

  private extractRawText(parsedData: ParsedResumeData): string {
    const parts: string[] = [];

    if (parsedData.contact?.fullName) {
      parts.push(parsedData.contact.fullName);
    }

    if (parsedData.summary) {
      parts.push(parsedData.summary);
    }

    for (const exp of parsedData.experience || []) {
      parts.push(`${exp.title} at ${exp.company}`);
      if (exp.description) {
        parts.push(exp.description);
      }
    }

    for (const edu of parsedData.education || []) {
      parts.push(`${edu.degree || ''} ${edu.field || ''} at ${edu.institution}`);
    }

    parts.push(...(parsedData.skills || []));

    return parts.join(' ').trim();
  }
}

