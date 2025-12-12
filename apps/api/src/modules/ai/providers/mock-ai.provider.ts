import { Logger } from '@nestjs/common';
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
 * Mock AI Provider
 * 
 * Simulates AI responses for development and testing.
 * Uses deterministic logic based on input to generate realistic mock data.
 */
export class MockAIProvider implements IAIProvider {
  private readonly logger = new Logger(MockAIProvider.name);
  readonly name = 'mock';

  // Mock data pools
  private readonly skills = [
    'Product Management', 'Agile', 'Scrum', 'JIRA', 'Data Analysis',
    'User Research', 'A/B Testing', 'SQL', 'Python', 'Stakeholder Management',
    'Roadmap Planning', 'PRDs', 'OKRs', 'Project Management', 'Leadership',
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure',
    'Machine Learning', 'Data Science', 'Communication', 'Problem Solving',
  ];

  private readonly companies = [
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber',
    'Airbnb', 'Stripe', 'Salesforce', 'Adobe', 'LinkedIn', 'Twitter', 'Snap',
  ];

  private readonly titles = [
    'Product Manager', 'Senior PM', 'Associate PM', 'Project Manager',
    'Program Manager', 'Software Engineer', 'Senior Engineer', 'Tech Lead',
    'Data Analyst', 'UX Designer', 'Marketing Manager', 'Sales Manager',
  ];

  private readonly universities = [
    'Stanford University', 'MIT', 'UC Berkeley', 'Harvard', 'Columbia',
    'Northwestern', 'Carnegie Mellon', 'University of Michigan', 'UCLA',
    'Georgia Tech', 'University of Texas', 'Cornell', 'NYU', 'USC',
  ];

  async parseDocument(input: DocumentParseInput): Promise<DocumentParseResult> {
    this.logger.debug(`Mock parsing document: ${input.fileName}`);
    
    // Simulate processing delay
    await this.delay(500 + Math.random() * 500);

    // Generate mock text based on filename
    const name = this.parseNameFromFilename(input.fileName);
    const mockText = this.generateMockResumeText(name);

    return {
      text: mockText,
      pages: 1 + Math.floor(Math.random() * 2),
      confidence: 0.92 + Math.random() * 0.05,
      metadata: {
        fileName: input.fileName,
        fileType: input.mimeType,
        parsedAt: new Date(),
        parserVersion: 'mock-v1.0',
      },
    };
  }

  async analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisResult> {
    const startTime = Date.now();
    this.logger.debug(`Mock analyzing resume for job: ${input.job.title}`);

    // Simulate processing delay
    await this.delay(1000 + Math.random() * 1000);

    // Parse candidate data from text or generate mock
    const candidateData = this.extractCandidateData(input.resumeText, input.parsedData);

    // Generate scores based on job matching
    const scores = this.generateScores(candidateData, input.job);

    const processingTime = Date.now() - startTime;

    return {
      candidateData,
      scores,
      modelVersion: 'mock-ai-v1.0',
      processingTime,
    };
  }

  async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; details?: Record<string, string> }> {
    return {
      status: 'ok',
      details: {
        provider: 'mock',
        message: 'Mock AI provider is always healthy',
      },
    };
  }

  /**
   * Extract or generate candidate data from resume text
   */
  private extractCandidateData(
    resumeText: string,
    existingData?: Partial<ParsedCandidateData>,
  ): ParsedCandidateData {
    // Try to extract name from text
    const nameMatch = resumeText.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)/m);
    const firstName = existingData?.firstName || nameMatch?.[1] || this.randomFrom(['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica']);
    const lastName = existingData?.lastName || nameMatch?.[2] || this.randomFrom(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia']);

    // Generate unique email
    const emailDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'email.com'];
    const email = existingData?.email || 
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${this.randomFrom(emailDomains)}`;

    // Generate skills (5-10)
    const numSkills = 5 + Math.floor(Math.random() * 6);
    const selectedSkills = this.shuffleArray([...this.skills]).slice(0, numSkills);

    // Generate experience
    const experienceYears = 2 + Math.floor(Math.random() * 10);
    const numJobs = Math.min(4, Math.ceil(experienceYears / 2.5));
    const experience = Array.from({ length: numJobs }, (_, i) => {
      const yearsAtJob = Math.ceil(experienceYears / numJobs);
      const startYear = 2024 - experienceYears + (i * yearsAtJob);
      return {
        company: this.randomFrom(this.companies),
        title: this.randomFrom(this.titles),
        startDate: `${startYear}-01`,
        endDate: i === numJobs - 1 ? 'Present' : `${startYear + yearsAtJob}-01`,
        years: yearsAtJob,
        description: `Led cross-functional initiatives in ${this.randomFrom(selectedSkills)} and ${this.randomFrom(selectedSkills)}.`,
      };
    });

    // Generate education
    const education = [{
      institution: this.randomFrom(this.universities),
      degree: this.randomFrom(['Bachelor of Science', 'Bachelor of Arts', 'Master of Science', 'MBA']),
      field: this.randomFrom(['Computer Science', 'Business Administration', 'Engineering', 'Economics', 'Data Science']),
      graduationYear: 2024 - experienceYears - 4,
    }];

    const cities = ['San Francisco', 'New York', 'Seattle', 'Austin', 'Boston', 'Los Angeles', 'Chicago', 'Denver'];
    const states = ['CA', 'NY', 'WA', 'TX', 'MA', 'CA', 'IL', 'CO'];
    const cityIndex = Math.floor(Math.random() * cities.length);

    return {
      firstName,
      lastName,
      email,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      city: cities[cityIndex],
      state: states[cityIndex],
      country: 'USA',
      skills: selectedSkills,
      experience,
      education,
      certifications: Math.random() > 0.5 ? [
        this.randomFrom(['PMP', 'AWS Certified', 'Scrum Master', 'Google Analytics', 'Six Sigma']),
      ] : undefined,
      summary: `Experienced professional with ${experienceYears}+ years in ${selectedSkills.slice(0, 2).join(' and ')}. Proven track record in ${selectedSkills[2] || 'project delivery'} and cross-functional collaboration.`,
      rawText: resumeText,
    };
  }

  /**
   * Generate scores based on candidate-job match
   */
  private generateScores(candidate: ParsedCandidateData, job: any): ResumeScores {
    const jobRequirements: string[] = Array.isArray(job.requirements) 
      ? job.requirements 
      : (typeof job.requirements === 'string' ? JSON.parse(job.requirements || '[]') : []);

    // Calculate skills match
    const matchedSkills = candidate.skills.filter(skill =>
      jobRequirements.some(req =>
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase()) ||
        job.title.toLowerCase().includes(skill.toLowerCase())
      )
    );
    const missingSkills = jobRequirements.filter(req =>
      !candidate.skills.some(skill =>
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );

    const skillsMatchScore = Math.min(100, 40 + (matchedSkills.length / Math.max(1, jobRequirements.length)) * 60);

    // Calculate experience match
    const totalYears = candidate.experience.reduce((sum, exp) => sum + exp.years, 0);
    const experienceMatchScore = Math.min(100, 30 + totalYears * 7);

    // Education score
    const educationMatchScore = 60 + Math.floor(Math.random() * 30);

    // Certifications bonus
    const certificationsScore = candidate.certifications?.length 
      ? 70 + Math.floor(Math.random() * 25) 
      : 50;

    // Overall fit (weighted average)
    const overallFitScore = Math.round(
      skillsMatchScore * 0.35 +
      experienceMatchScore * 0.30 +
      educationMatchScore * 0.20 +
      certificationsScore * 0.15
    );

    // Overall score with variance
    const overallScore = Math.min(100, Math.max(40, overallFitScore + Math.floor(Math.random() * 10) - 5));

    // Generate highlights and concerns
    const highlights: string[] = [];
    const concerns: string[] = [];

    if (matchedSkills.length >= 3) {
      highlights.push(`Strong alignment with ${matchedSkills.length} key skills`);
    }
    if (totalYears >= 5) {
      highlights.push(`Solid ${totalYears}+ years of relevant experience`);
    }
    if (candidate.certifications?.length) {
      highlights.push(`Professional certifications: ${candidate.certifications.join(', ')}`);
    }

    if (missingSkills.length > 2) {
      concerns.push(`Missing ${missingSkills.length} required skills`);
    }
    if (totalYears < 3) {
      concerns.push('Limited professional experience');
    }

    // Generate explanation
    const explanation = this.generateExplanation(candidate, job, {
      skillsMatchScore,
      experienceMatchScore,
      overallScore,
      totalYears,
      matchedSkills,
    });

    return {
      overallScore,
      confidence: 0.75 + Math.random() * 0.2,
      skillsMatchScore: Math.round(skillsMatchScore),
      experienceMatchScore: Math.round(experienceMatchScore),
      educationMatchScore: Math.round(educationMatchScore),
      certificationsScore: Math.round(certificationsScore),
      overallFitScore: Math.round(overallFitScore),
      explanation,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 5),
      highlights,
      concerns,
    };
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    candidate: ParsedCandidateData,
    job: any,
    scores: {
      skillsMatchScore: number;
      experienceMatchScore: number;
      overallScore: number;
      totalYears: number;
      matchedSkills: string[];
    },
  ): string {
    let explanation = `${candidate.firstName} ${candidate.lastName} scored ${scores.overallScore}% for the ${job.title} position. `;

    if (scores.skillsMatchScore >= 70) {
      explanation += `Strong skills alignment with ${scores.matchedSkills.slice(0, 3).join(', ')}. `;
    } else if (scores.skillsMatchScore >= 50) {
      explanation += `Partial skills match including ${scores.matchedSkills.slice(0, 2).join(', ')}. `;
    } else {
      explanation += `Limited skills overlap with job requirements. `;
    }

    if (scores.totalYears >= 7) {
      explanation += `Extensive experience with ${scores.totalYears}+ years in the field. `;
    } else if (scores.totalYears >= 4) {
      explanation += `Good experience level with ${scores.totalYears} years in similar roles. `;
    } else {
      explanation += `Earlier career stage with ${scores.totalYears} years of experience. `;
    }

    if (scores.overallScore >= 80) {
      explanation += 'Highly recommended for interview.';
    } else if (scores.overallScore >= 65) {
      explanation += 'Recommended for phone screen.';
    } else if (scores.overallScore >= 50) {
      explanation += 'Consider for further review.';
    } else {
      explanation += 'May not be the best fit for this role.';
    }

    return explanation;
  }

  /**
   * Parse name from filename
   */
  private parseNameFromFilename(filename: string): { firstName?: string; lastName?: string } {
    const nameWithoutExt = filename.replace(/\.(pdf|doc|docx)$/i, '');
    const parts = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .split(/\s+/)
      .filter(p => p.length > 1 && !/resume|cv|curriculum|vitae/i.test(p));

    if (parts.length >= 2) {
      const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      return {
        firstName: capitalize(parts[0]),
        lastName: capitalize(parts[parts.length - 1]),
      };
    }

    return {};
  }

  /**
   * Generate mock resume text
   */
  private generateMockResumeText(name: { firstName?: string; lastName?: string }): string {
    const firstName = name.firstName || 'John';
    const lastName = name.lastName || 'Doe';
    const skills = this.shuffleArray([...this.skills]).slice(0, 6);

    return `
${firstName} ${lastName}
${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com | +1-555-1234 | San Francisco, CA

SUMMARY
Experienced professional with expertise in ${skills.slice(0, 3).join(', ')}.

EXPERIENCE
${this.randomFrom(this.titles)} at ${this.randomFrom(this.companies)}
2020 - Present
- Led initiatives in ${skills[0]} and ${skills[1]}
- Collaborated with cross-functional teams

${this.randomFrom(this.titles)} at ${this.randomFrom(this.companies)}
2017 - 2020
- Managed projects involving ${skills[2]} and ${skills[3]}
- Delivered results exceeding targets

EDUCATION
${this.randomFrom(this.universities)}
Bachelor of Science in Computer Science
2013 - 2017

SKILLS
${skills.join(', ')}
    `.trim();
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}


