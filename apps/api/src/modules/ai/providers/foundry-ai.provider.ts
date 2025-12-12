import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAIProvider,
  DocumentParseInput,
  DocumentParseResult,
  ResumeAnalysisInput,
  ResumeAnalysisResult,
  ParsedCandidateData,
  ResumeScores,
} from '../interfaces/ai-provider.interface';

/**
 * Azure AI Foundry Provider
 * 
 * Production AI provider using:
 * - Azure Document Intelligence for document parsing
 * - Azure OpenAI (GPT-4) for resume analysis and scoring
 * - Azure AI Foundry for agent orchestration
 */
export class FoundryAIProvider implements IAIProvider {
  private readonly logger = new Logger(FoundryAIProvider.name);
  readonly name = 'foundry';

  // Azure configuration
  private readonly openaiEndpoint: string;
  private readonly openaiKey: string;
  private readonly openaiDeployment: string;
  private readonly openaiApiVersion: string;

  private readonly docIntelligenceEndpoint: string;
  private readonly docIntelligenceKey: string;

  // Lazy-loaded clients
  private openaiClient: any;
  private docIntelligenceClient: any;

  constructor(private readonly configService: ConfigService) {
    // Load Azure OpenAI configuration
    this.openaiEndpoint = this.configService.get<string>('AZURE_OPENAI_ENDPOINT', '');
    this.openaiKey = this.configService.get<string>('AZURE_OPENAI_KEY', '');
    this.openaiDeployment = this.configService.get<string>('AZURE_OPENAI_DEPLOYMENT', 'gpt-4');
    this.openaiApiVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION', '2024-02-15-preview');

    // Load Document Intelligence configuration
    this.docIntelligenceEndpoint = this.configService.get<string>('AZURE_DOC_INTELLIGENCE_ENDPOINT', '');
    this.docIntelligenceKey = this.configService.get<string>('AZURE_DOC_INTELLIGENCE_KEY', '');

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const missing: string[] = [];
    
    if (!this.openaiEndpoint) missing.push('AZURE_OPENAI_ENDPOINT');
    if (!this.openaiKey) missing.push('AZURE_OPENAI_KEY');
    if (!this.docIntelligenceEndpoint) missing.push('AZURE_DOC_INTELLIGENCE_ENDPOINT');
    if (!this.docIntelligenceKey) missing.push('AZURE_DOC_INTELLIGENCE_KEY');

    if (missing.length > 0) {
      this.logger.warn(`Missing Azure configuration: ${missing.join(', ')}. Some features may not work.`);
    }
  }

  /**
   * Initialize Azure OpenAI client lazily
   */
  private async getOpenAIClient(): Promise<any> {
    if (!this.openaiClient) {
      // Dynamic import to avoid loading SDK at startup if not needed
      const { AzureOpenAI } = await import('openai');
      
      this.openaiClient = new AzureOpenAI({
        endpoint: this.openaiEndpoint,
        apiKey: this.openaiKey,
        apiVersion: this.openaiApiVersion,
        deployment: this.openaiDeployment,
      });
      
      this.logger.log('Azure OpenAI client initialized');
    }
    return this.openaiClient;
  }

  /**
   * Initialize Document Intelligence client lazily
   */
  private async getDocIntelligenceClient(): Promise<any> {
    if (!this.docIntelligenceClient) {
      const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
      
      this.docIntelligenceClient = new DocumentAnalysisClient(
        this.docIntelligenceEndpoint,
        new AzureKeyCredential(this.docIntelligenceKey),
      );
      
      this.logger.log('Azure Document Intelligence client initialized');
    }
    return this.docIntelligenceClient;
  }

  async parseDocument(input: DocumentParseInput): Promise<DocumentParseResult> {
    const startTime = Date.now();
    this.logger.debug(`Parsing document: ${input.fileName}`);

    try {
      const client = await this.getDocIntelligenceClient();

      // Use prebuilt-read model for general document parsing
      const poller = await client.beginAnalyzeDocument('prebuilt-read', input.buffer);
      const result = await poller.pollUntilDone();

      // Extract text from all pages
      const textContent: string[] = [];
      let pageCount = 0;
      let totalConfidence = 0;
      let confidenceCount = 0;

      if (result.pages) {
        pageCount = result.pages.length;
        for (const page of result.pages) {
          if (page.lines) {
            for (const line of page.lines) {
              textContent.push(line.content);
              if (line.confidence !== undefined) {
                totalConfidence += line.confidence;
                confidenceCount++;
              }
            }
          }
        }
      }

      // Also capture any paragraphs for better structure
      if (result.paragraphs) {
        for (const paragraph of result.paragraphs) {
          if (!textContent.includes(paragraph.content)) {
            textContent.push(paragraph.content);
          }
        }
      }

      const text = textContent.join('\n');
      const confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.9;

      this.logger.debug(`Document parsed: ${pageCount} pages, ${text.length} chars`);

      return {
        text,
        pages: pageCount,
        confidence,
        metadata: {
          fileName: input.fileName,
          fileType: input.mimeType,
          parsedAt: new Date(),
          parserVersion: 'azure-doc-intelligence-v4',
        },
      };
    } catch (error) {
      this.logger.error(`Document parsing failed: ${error.message}`);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  async analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisResult> {
    const startTime = Date.now();
    this.logger.debug(`Analyzing resume for job: ${input.job.title}`);

    try {
      const client = await this.getOpenAIClient();

      // Build the analysis prompt
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildAnalysisPrompt(input);

      // Call Azure OpenAI
      const response = await client.chat.completions.create({
        model: this.openaiDeployment,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Azure OpenAI');
      }

      // Parse the JSON response
      const analysisResult = JSON.parse(content);

      // Map the response to our interfaces
      const candidateData = this.mapToCandidateData(analysisResult.candidate, input.resumeText);
      const scores = this.mapToScores(analysisResult.scores, analysisResult.analysis);

      const processingTime = Date.now() - startTime;
      this.logger.debug(`Resume analyzed in ${processingTime}ms, score: ${scores.overallScore}`);

      return {
        candidateData,
        scores,
        modelVersion: `azure-openai-${this.openaiDeployment}`,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Resume analysis failed: ${error.message}`);
      throw new Error(`Failed to analyze resume: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; details?: Record<string, string> }> {
    const details: Record<string, string> = { provider: 'foundry' };
    let hasError = false;
    let hasDegraded = false;

    // Check OpenAI
    try {
      const client = await this.getOpenAIClient();
      const response = await client.chat.completions.create({
        model: this.openaiDeployment,
        messages: [{ role: 'user', content: 'Health check: respond with "ok"' }],
        max_tokens: 10,
      });
      details.openai = response.choices[0]?.message?.content?.includes('ok') ? 'connected' : 'responding';
    } catch (error) {
      details.openai = `error: ${error.message}`;
      hasError = true;
    }

    // Check Document Intelligence
    try {
      await this.getDocIntelligenceClient();
      details.documentIntelligence = 'connected';
    } catch (error) {
      details.documentIntelligence = `error: ${error.message}`;
      hasDegraded = true;
    }

    return {
      status: hasError ? 'error' : hasDegraded ? 'degraded' : 'ok',
      details,
    };
  }

  /**
   * Build system prompt for resume analysis
   */
  private buildSystemPrompt(): string {
    return `You are an expert HR analyst and talent evaluator with years of experience in technical recruiting. Your role is to objectively analyze candidate resumes against job requirements.

You MUST respond with valid JSON in this exact format:
{
  "candidate": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "linkedInUrl": "string or null",
    "skills": ["array of skills"],
    "experience": [
      {
        "company": "string",
        "title": "string",
        "years": number,
        "description": "brief description"
      }
    ],
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "field": "string"
      }
    ],
    "summary": "2-3 sentence professional summary"
  },
  "scores": {
    "overallScore": number (0-100),
    "confidence": number (0-1),
    "skillsMatchScore": number (0-100),
    "experienceMatchScore": number (0-100),
    "educationMatchScore": number (0-100),
    "overallFitScore": number (0-100)
  },
  "analysis": {
    "explanation": "2-3 sentence evaluation summary",
    "matchedSkills": ["skills that match requirements"],
    "missingSkills": ["required skills not found"],
    "highlights": ["positive aspects"],
    "concerns": ["potential issues"]
  }
}

Scoring guidelines:
- 90-100: Exceptional match, exceeds requirements
- 75-89: Strong match, meets most requirements  
- 60-74: Moderate match, meets some requirements
- 45-59: Weak match, significant gaps
- 0-44: Poor match, does not meet requirements

Be objective and fair. Focus on qualifications, not demographics.`;
  }

  /**
   * Build user prompt with resume and job details
   */
  private buildAnalysisPrompt(input: ResumeAnalysisInput): string {
    const requirements = Array.isArray(input.job.requirements) 
      ? input.job.requirements 
      : [];

    return `## Job Position: ${input.job.title}

### Job Requirements:
${requirements.map(r => `- ${r}`).join('\n') || 'Not specified'}

### Job Description:
${input.job.description || 'Not provided'}

### Additional Context:
- Department: ${input.job.department || 'Not specified'}
- Location: ${input.job.location || 'Not specified'}
- Employment Type: ${input.job.employmentType || 'Full-time'}

---

## Candidate Resume:

${input.resumeText}

---

Please analyze this resume against the job requirements and provide your evaluation in the specified JSON format.`;
  }

  /**
   * Map AI response to ParsedCandidateData
   */
  private mapToCandidateData(aiCandidate: any, rawText: string): ParsedCandidateData {
    return {
      firstName: aiCandidate.firstName || 'Unknown',
      lastName: aiCandidate.lastName || 'Candidate',
      email: aiCandidate.email || '',
      phone: aiCandidate.phone || '',
      city: aiCandidate.city || undefined,
      state: aiCandidate.state || undefined,
      country: aiCandidate.country || undefined,
      linkedInUrl: aiCandidate.linkedInUrl || undefined,
      skills: Array.isArray(aiCandidate.skills) ? aiCandidate.skills : [],
      experience: Array.isArray(aiCandidate.experience) 
        ? aiCandidate.experience.map((exp: any) => ({
            company: exp.company || '',
            title: exp.title || '',
            years: exp.years || 0,
            description: exp.description || '',
          }))
        : [],
      education: Array.isArray(aiCandidate.education)
        ? aiCandidate.education.map((edu: any) => ({
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
          }))
        : [],
      summary: aiCandidate.summary || '',
      rawText,
    };
  }

  /**
   * Map AI response to ResumeScores
   */
  private mapToScores(aiScores: any, aiAnalysis: any): ResumeScores {
    return {
      overallScore: this.clampScore(aiScores.overallScore),
      confidence: Math.min(1, Math.max(0, aiScores.confidence || 0.8)),
      skillsMatchScore: this.clampScore(aiScores.skillsMatchScore),
      experienceMatchScore: this.clampScore(aiScores.experienceMatchScore),
      educationMatchScore: this.clampScore(aiScores.educationMatchScore),
      overallFitScore: this.clampScore(aiScores.overallFitScore),
      explanation: aiAnalysis.explanation || '',
      matchedSkills: Array.isArray(aiAnalysis.matchedSkills) ? aiAnalysis.matchedSkills : [],
      missingSkills: Array.isArray(aiAnalysis.missingSkills) ? aiAnalysis.missingSkills : [],
      highlights: Array.isArray(aiAnalysis.highlights) ? aiAnalysis.highlights : [],
      concerns: Array.isArray(aiAnalysis.concerns) ? aiAnalysis.concerns : [],
    };
  }

  /**
   * Clamp score to valid range
   */
  private clampScore(score: number | undefined): number {
    if (score === undefined || isNaN(score)) return 50;
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}


