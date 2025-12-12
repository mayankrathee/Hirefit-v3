import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeaturesService } from '../../features/features.service';
import {
  AI_PROVIDER,
  IAIProvider,
  ResumeAnalysisInput,
  ResumeAnalysisResult,
  JobContext,
  ParsedCandidateData,
  ResumeScores,
} from '../interfaces/ai-provider.interface';

/**
 * Resume Scoring Agent Service
 * 
 * Orchestrates the full resume analysis workflow:
 * 1. Validates feature access and limits
 * 2. Loads job context from database
 * 3. Calls AI provider for analysis
 * 4. Tracks usage
 */
@Injectable()
export class ResumeScoringAgentService {
  private readonly logger = new Logger(ResumeScoringAgentService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly prisma: PrismaService,
    private readonly featuresService: FeaturesService,
  ) {}

  /**
   * Score a resume against a job
   * 
   * @param resumeText - Extracted text from resume
   * @param jobId - Job ID to score against
   * @param tenantId - Tenant ID for feature tracking
   * @returns Analysis result with candidate data and scores
   */
  async scoreResume(
    resumeText: string,
    jobId: string,
    tenantId: string,
  ): Promise<ResumeAnalysisResult> {
    this.logger.debug(`Scoring resume for job ${jobId}`);

    // Check feature access (will throw if not allowed)
    await this.featuresService.checkFeatureLimit(tenantId, 'ai_screening');

    // Load job context
    const job = await this.loadJobContext(jobId, tenantId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Prepare analysis input
    const input: ResumeAnalysisInput = {
      resumeText,
      job,
    };

    // Call AI provider
    const result = await this.aiProvider.analyzeResume(input);

    // Increment usage after successful analysis
    await this.featuresService.incrementUsage(tenantId, 'ai_screening');

    this.logger.log(
      `Resume scored: ${result.scores.overallScore}% ` +
      `(confidence: ${(result.scores.confidence * 100).toFixed(0)}%) ` +
      `in ${result.processingTime}ms`,
    );

    return result;
  }

  /**
   * Process a complete resume workflow
   * - Parse document (if provided)
   * - Analyze and score
   * - Update database records
   */
  async processResume(
    resumeId: string,
    jobId: string,
    tenantId: string,
    userId: string,
    resumeText: string,
  ): Promise<{
    candidateId: string;
    scores: ResumeScores;
    candidateData: ParsedCandidateData;
  }> {
    this.logger.log(`Processing resume ${resumeId} for job ${jobId}`);

    const startTime = Date.now();

    try {
      // Get the job
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // Score the resume
      const analysisResult = await this.scoreResume(resumeText, jobId, tenantId);
      const { candidateData, scores, modelVersion } = analysisResult;

      // Check if candidate already exists by email
      let candidate = await this.prisma.candidate.findFirst({
        where: { tenantId, email: candidateData.email },
      });

      if (!candidate) {
        // Create new candidate
        candidate = await this.prisma.candidate.create({
          data: {
            tenantId,
            createdById: userId,
            email: candidateData.email,
            firstName: candidateData.firstName,
            lastName: candidateData.lastName,
            phone: candidateData.phone,
            city: candidateData.city,
            state: candidateData.state,
            country: candidateData.country,
            linkedInUrl: candidateData.linkedInUrl,
            source: 'resume_upload',
            sourceDetails: `Uploaded for job: ${job.title}`,
            tags: JSON.stringify(candidateData.skills.slice(0, 5)),
            isActive: true,
          },
        });

        this.logger.log(`Created candidate ${candidate.id} from resume`);
      }

      // Update resume with candidate and parsed data
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          candidateId: candidate.id,
          processingStatus: 'completed',
          processedAt: new Date(),
          parsedData: JSON.stringify(candidateData),
          parseConfidence: scores.confidence,
          rawText: resumeText,
        },
      });

      // Create or update resume score
      await this.prisma.resumeScore.upsert({
        where: {
          resumeId_jobId: { resumeId, jobId },
        },
        create: {
          resumeId,
          jobId,
          overallScore: scores.overallScore,
          confidence: scores.confidence,
          skillsMatchScore: scores.skillsMatchScore,
          experienceMatchScore: scores.experienceMatchScore,
          educationMatchScore: scores.educationMatchScore,
          overallFitScore: scores.overallFitScore,
          explanation: JSON.stringify({
            summary: scores.explanation,
            matchedSkills: scores.matchedSkills,
            missingSkills: scores.missingSkills,
            highlights: scores.highlights,
            concerns: scores.concerns,
          }),
          modelVersion,
          rubricVersion: '1.0',
        },
        update: {
          overallScore: scores.overallScore,
          confidence: scores.confidence,
          skillsMatchScore: scores.skillsMatchScore,
          experienceMatchScore: scores.experienceMatchScore,
          educationMatchScore: scores.educationMatchScore,
          overallFitScore: scores.overallFitScore,
          explanation: JSON.stringify({
            summary: scores.explanation,
            matchedSkills: scores.matchedSkills,
            missingSkills: scores.missingSkills,
            highlights: scores.highlights,
            concerns: scores.concerns,
          }),
          modelVersion,
          rubricVersion: '1.0',
          scoredAt: new Date(),
        },
      });

      // Create application linking candidate to job (if not exists)
      const existingApplication = await this.prisma.application.findFirst({
        where: { candidateId: candidate.id, jobId },
      });

      if (!existingApplication) {
        await this.prisma.application.create({
          data: {
            candidateId: candidate.id,
            jobId,
            status: 'new',
            notes: `Auto-created from resume upload. AI Score: ${scores.overallScore}%`,
          },
        });
        this.logger.log(`Created application for candidate ${candidate.id} to job ${jobId}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Completed processing resume ${resumeId}: Score ${scores.overallScore}% in ${processingTime}ms`,
      );

      return {
        candidateId: candidate.id,
        scores,
        candidateData,
      };
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
   * Load job context from database
   */
  private async loadJobContext(jobId: string, tenantId: string): Promise<JobContext | null> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      return null;
    }

    // Parse requirements from JSON
    let requirements: string[] = [];
    try {
      requirements = JSON.parse(job.requirements || '[]');
    } catch {
      requirements = [];
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements,
      department: job.department || undefined,
      location: job.location || undefined,
      employmentType: job.employmentType,
    };
  }

  /**
   * Get AI provider health status
   */
  async getProviderHealth(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    provider: string;
    details?: Record<string, string>;
  }> {
    const health = await this.aiProvider.healthCheck();
    return {
      ...health,
      provider: this.aiProvider.name,
    };
  }
}


