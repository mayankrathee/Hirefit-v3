/**
 * AI Provider Interface
 * Defines contracts for document parsing and resume analysis
 */

/**
 * Parsed candidate data extracted from resume
 */
export interface ParsedCandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  country?: string;
  linkedInUrl?: string;
  websiteUrl?: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate?: string;
    endDate?: string;
    years: number;
    description?: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationYear?: number;
  }>;
  certifications?: string[];
  summary: string;
  rawText: string;
}

/**
 * Resume scores against job requirements
 */
export interface ResumeScores {
  overallScore: number;
  confidence: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  educationMatchScore: number;
  certificationsScore?: number;
  overallFitScore: number;
  explanation: string;
  matchedSkills: string[];
  missingSkills: string[];
  highlights: string[];
  concerns: string[];
}

/**
 * Job context for scoring
 */
export interface JobContext {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  department?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
}

/**
 * Document parsing input
 */
export interface DocumentParseInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

/**
 * Document parsing result
 */
export interface DocumentParseResult {
  text: string;
  pages: number;
  confidence: number;
  metadata: {
    fileName: string;
    fileType: string;
    parsedAt: Date;
    parserVersion: string;
  };
}

/**
 * Resume analysis input
 */
export interface ResumeAnalysisInput {
  resumeText: string;
  parsedData?: Partial<ParsedCandidateData>;
  job: JobContext;
}

/**
 * Resume analysis result
 */
export interface ResumeAnalysisResult {
  candidateData: ParsedCandidateData;
  scores: ResumeScores;
  modelVersion: string;
  processingTime: number;
}

/**
 * AI Provider interface - implemented by Mock and Foundry providers
 */
export interface IAIProvider {
  /**
   * Provider name for logging and identification
   */
  readonly name: string;

  /**
   * Parse a document (PDF, DOC, DOCX) and extract text
   */
  parseDocument(input: DocumentParseInput): Promise<DocumentParseResult>;

  /**
   * Analyze a resume against job requirements
   */
  analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisResult>;

  /**
   * Health check for the provider
   */
  healthCheck(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    details?: Record<string, string>;
  }>;
}

/**
 * AI Provider token for dependency injection
 */
export const AI_PROVIDER = Symbol('AI_PROVIDER');


