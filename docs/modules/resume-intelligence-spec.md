# Resume Intelligence Service - Functional Specification

## Overview

The Resume Intelligence Service is the core AI-powered module for parsing, analyzing, and scoring candidate resumes against job requirements. It leverages Microsoft Foundry for agent orchestration and Azure OpenAI for natural language understanding.

---

## 1. Module Scope

### 1.1 Core Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Resume Parsing | Extract structured data from PDF, DOCX, images | P0 |
| Skill Extraction | Identify skills, technologies, certifications | P0 |
| Experience Mapping | Map work history to structured timeline | P0 |
| Education Extraction | Parse academic credentials | P0 |
| AI Scoring | Score resumes against job requirements | P0 |
| Semantic Search | Enable natural language candidate search | P1 |
| Duplicate Detection | Identify duplicate/similar candidates | P1 |
| Bias Detection | Flag potential bias in screening | P1 |

### 1.2 Out of Scope (Phase 1)

- Video resume processing
- Social media profile integration
- Real-time resume editing suggestions
- Automated outreach

---

## 2. Functional Requirements

### 2.1 Resume Upload & Processing

#### FR-RES-001: Multi-Format Resume Upload
**Description**: System shall accept resumes in multiple formats.

**Acceptance Criteria**:
- Accept PDF files (up to 10MB)
- Accept DOCX files (up to 10MB)
- Accept DOC files (up to 10MB)
- Accept TXT files (up to 5MB)
- Accept images (PNG, JPG, JPEG) for scanned resumes (up to 10MB)
- Validate file type and size before upload
- Display upload progress indicator
- Support drag-and-drop upload
- Support bulk upload (up to 50 files)

#### FR-RES-002: Resume Parsing Pipeline
**Description**: System shall automatically parse uploaded resumes.

**Processing Flow**:
```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Upload  │───▶│ Validate │───▶│   OCR    │───▶│  Parse   │───▶│  Index   │
│          │    │          │    │(if image)│    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                               │               │
                     ▼                               ▼               ▼
               ┌──────────┐                    ┌──────────┐    ┌──────────┐
               │  Virus   │                    │   AI     │    │  Search  │
               │   Scan   │                    │ Scoring  │    │  Engine  │
               └──────────┘                    └──────────┘    └──────────┘
```

**Acceptance Criteria**:
- Process resumes within 30 seconds (P95)
- Extract contact information (name, email, phone, location)
- Extract work experience with dates, titles, companies
- Extract education with institutions, degrees, dates
- Extract skills and technologies
- Extract certifications and licenses
- Preserve original document for reference
- Generate JSON structured output
- Handle parsing failures gracefully with manual review queue

#### FR-RES-003: OCR Processing
**Description**: System shall perform OCR on image-based resumes.

**Acceptance Criteria**:
- Support English language OCR (primary)
- Support multi-language OCR (configurable by tenant)
- Maintain text layout structure
- Achieve >95% character accuracy on clear documents
- Flag low-quality scans for manual review

### 2.2 Skill & Experience Extraction

#### FR-RES-004: Skill Taxonomy
**Description**: System shall map extracted skills to a standardized taxonomy.

**Skill Categories**:
- Technical Skills (programming languages, frameworks, tools)
- Soft Skills (communication, leadership, teamwork)
- Domain Skills (finance, healthcare, manufacturing)
- Certifications (AWS, PMP, CPA)
- Languages (spoken/written proficiency)

**Acceptance Criteria**:
- Map to standardized skill taxonomy
- Infer skills from context (e.g., "built React applications" → React, JavaScript)
- Differentiate skill levels when mentioned
- Allow custom skill taxonomy per tenant
- Support skill synonyms and variations

#### FR-RES-005: Experience Timeline
**Description**: System shall construct a structured work history timeline.

**Acceptance Criteria**:
- Parse date ranges (handle various formats)
- Calculate total experience duration
- Identify career gaps (>3 months)
- Classify roles by function/level
- Extract key achievements and metrics
- Identify career progression patterns

### 2.3 AI Scoring Engine

#### FR-RES-006: Resume Scoring
**Description**: System shall score resumes against job requirements using AI.

**Scoring Dimensions**:
| Dimension | Weight (Default) | Description |
|-----------|-----------------|-------------|
| Skills Match | 35% | Overlap with required/preferred skills |
| Experience Match | 25% | Relevance and duration of experience |
| Education Match | 15% | Degree and field alignment |
| Certifications | 10% | Required/preferred certifications |
| Location | 5% | Proximity/remote eligibility |
| Overall Fit | 10% | AI-assessed holistic fit |

**Acceptance Criteria**:
- Generate overall score (0-100)
- Generate dimension scores with explanations
- Provide score confidence level
- Support configurable scoring weights per job
- Complete scoring within 10 seconds
- Store score reasoning for audit trail

#### FR-RES-007: Scoring Explanation
**Description**: System shall provide human-readable explanations for scores.

**Acceptance Criteria**:
- List top 5 positive factors
- List top 5 areas of concern
- Highlight skill gaps
- Explain experience relevance
- Provide comparison to role requirements
- Support multiple detail levels (summary, detailed, technical)

#### FR-RES-008: Configurable Scoring Rubrics
**Description**: System shall allow customization of scoring criteria.

**Acceptance Criteria**:
- Allow weight adjustment per dimension
- Support must-have vs nice-to-have skills
- Allow knockout criteria (automatic disqualification)
- Support role-specific rubrics
- Allow tenant-level default rubrics
- Provide rubric templates for common roles

### 2.4 Search & Discovery

#### FR-RES-009: Semantic Candidate Search
**Description**: System shall enable natural language search across candidates.

**Search Capabilities**:
- Free-text search across all resume content
- Skill-based filtering
- Experience range filtering
- Location-based filtering
- Education filtering
- Score range filtering
- Boolean search operators

**Acceptance Criteria**:
- Return results within 2 seconds
- Support faceted search refinement
- Display relevance scores
- Highlight matching terms
- Support saved searches
- Support search alerts (notify on new matches)

#### FR-RES-010: Candidate Matching
**Description**: System shall proactively match candidates to open jobs.

**Acceptance Criteria**:
- Generate match scores for all open jobs
- Surface top matches on candidate profile
- Alert recruiters to strong matches
- Support bulk matching for talent pools
- Explain match reasoning

### 2.5 Quality & Compliance

#### FR-RES-011: Duplicate Detection
**Description**: System shall identify duplicate or similar candidates.

**Acceptance Criteria**:
- Detect exact duplicates (same email/phone)
- Detect similar profiles (fuzzy matching)
- Calculate similarity score
- Allow merge of duplicate profiles
- Maintain audit trail of merges

#### FR-RES-012: Bias Monitoring
**Description**: System shall monitor scoring for potential bias.

**Acceptance Criteria**:
- Redact identifying information during scoring (optional)
- Monitor score distributions by demographic groups
- Alert on statistical anomalies
- Generate bias audit reports
- Support A/B testing of scoring algorithms

---

## 3. Data Model

### 3.1 Core Entities

```typescript
// Resume entity
interface Resume {
  id: string;                    // UUID
  tenantId: string;              // Tenant isolation
  candidateId: string;           // Associated candidate
  
  // File metadata
  originalFileName: string;
  storagePath: string;           // Blob storage path
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: Date;
  uploadedBy: string;
  
  // Processing status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingError?: string;
  
  // Parsed data
  parsedData?: ParsedResume;
  parseConfidence: number;       // 0-1
  
  // AI scoring
  scores?: ResumeScores[];       // Scores against different jobs
  
  // Metadata
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Parsed resume structure
interface ParsedResume {
  // Contact information
  contact: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    linkedIn?: string;
    website?: string;
  };
  
  // Work experience
  experience: WorkExperience[];
  totalExperienceYears: number;
  
  // Education
  education: Education[];
  
  // Skills
  skills: Skill[];
  
  // Certifications
  certifications: Certification[];
  
  // Languages
  languages: Language[];
  
  // Summary
  summary?: string;
  
  // Raw text (for search)
  rawText: string;
}

interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent: boolean;
  description?: string;
  achievements?: string[];
  skills?: string[];
}

interface Education {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: number;
  honors?: string[];
}

interface Skill {
  name: string;
  category: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  lastUsed?: Date;
  source: 'explicit' | 'inferred';
}

interface Certification {
  name: string;
  issuer: string;
  issueDate?: Date;
  expirationDate?: Date;
  credentialId?: string;
}

interface Language {
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

// Resume scores
interface ResumeScores {
  resumeId: string;
  jobId: string;
  
  overallScore: number;          // 0-100
  confidence: number;            // 0-1
  
  dimensionScores: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    certifications: number;
    location: number;
    overallFit: number;
  };
  
  explanation: ScoreExplanation;
  
  scoredAt: Date;
  scoredBy: string;              // Model version
  rubricVersion: string;
}

interface ScoreExplanation {
  summary: string;
  positiveFactors: string[];
  concerns: string[];
  skillGaps: string[];
  recommendations: string[];
}
```

### 3.2 Database Schema

```sql
-- Resumes table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    
    original_file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    processing_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_error TEXT,
    
    parsed_data JSONB,
    parse_confidence DECIMAL(3,2),
    
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_processing_status CHECK (
        processing_status IN ('pending', 'processing', 'completed', 'failed')
    )
);

-- Row-level security for tenant isolation
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY resumes_tenant_isolation ON resumes
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Resume scores table
CREATE TABLE resume_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    
    overall_score DECIMAL(5,2) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    
    skills_match_score DECIMAL(5,2),
    experience_match_score DECIMAL(5,2),
    education_match_score DECIMAL(5,2),
    certifications_score DECIMAL(5,2),
    location_score DECIMAL(5,2),
    overall_fit_score DECIMAL(5,2),
    
    explanation JSONB NOT NULL,
    
    scored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    model_version VARCHAR(50) NOT NULL,
    rubric_version VARCHAR(50) NOT NULL,
    
    UNIQUE(resume_id, job_id)
);

-- Indexes
CREATE INDEX idx_resumes_tenant_candidate ON resumes(tenant_id, candidate_id);
CREATE INDEX idx_resumes_processing_status ON resumes(processing_status) 
    WHERE processing_status IN ('pending', 'processing');
CREATE INDEX idx_resume_scores_job ON resume_scores(job_id, overall_score DESC);
```

---

## 4. API Specification

### 4.1 Resume Upload

```yaml
POST /api/v1/resumes/upload
Content-Type: multipart/form-data

Request:
  file: binary (required)
  candidateId: string (optional - creates new if not provided)
  jobId: string (optional - triggers scoring if provided)
  metadata:
    source: string
    notes: string

Response (201):
  id: string
  status: "pending"
  candidateId: string
  uploadUrl: string (for direct blob upload if large file)

Response (400):
  error: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "VIRUS_DETECTED"
  message: string
```

### 4.2 Get Resume

```yaml
GET /api/v1/resumes/{id}

Response (200):
  id: string
  candidateId: string
  originalFileName: string
  processingStatus: string
  parsedData: ParsedResume | null
  scores: ResumeScores[]
  downloadUrl: string (SAS token URL)
  createdAt: string
  updatedAt: string
```

### 4.3 Score Resume

```yaml
POST /api/v1/resumes/{id}/score
Content-Type: application/json

Request:
  jobId: string (required)
  rubricOverrides: object (optional)

Response (200):
  resumeId: string
  jobId: string
  overallScore: number
  confidence: number
  dimensionScores: object
  explanation: ScoreExplanation
  scoredAt: string
```

### 4.4 Search Candidates

```yaml
POST /api/v1/candidates/search
Content-Type: application/json

Request:
  query: string (natural language or structured)
  filters:
    skills: string[]
    experienceYears: { min: number, max: number }
    location: { city: string, radius: number }
    education: { degree: string, field: string }
    scoreRange: { min: number, max: number }
    jobId: string (for match scores)
  sort:
    field: "relevance" | "score" | "experience" | "updatedAt"
    order: "asc" | "desc"
  pagination:
    page: number
    pageSize: number

Response (200):
  results:
    - candidateId: string
      resumeId: string
      name: string
      headline: string
      matchScore: number (if jobId provided)
      relevanceScore: number
      highlights: string[]
  total: number
  facets:
    skills: { name: string, count: number }[]
    locations: { name: string, count: number }[]
    experience: { range: string, count: number }[]
```

---

## 5. Microsoft Foundry Agent Design

### 5.1 Resume Scoring Agent

```yaml
agent:
  name: ResumeScorer
  description: Evaluates candidate resumes against job requirements
  
  inputs:
    - name: resume
      type: ParsedResume
      description: Structured resume data
    - name: jobRequirements
      type: JobRequirements
      description: Job posting requirements
    - name: rubric
      type: ScoringRubric
      description: Scoring configuration
  
  outputs:
    - name: scores
      type: ResumeScores
      description: Scoring results with explanations
  
  tools:
    - SkillMatcher
    - ExperienceAnalyzer
    - EducationEvaluator
    - LocationChecker
  
  constraints:
    max_iterations: 5
    timeout_seconds: 30
    require_explanation: true
    bias_check: true
  
  prompts:
    system: |
      You are an expert recruiter evaluating candidate resumes.
      Score objectively based on job requirements.
      Do not consider name, gender, age, or other protected characteristics.
      Provide clear explanations for all scores.
      Be constructive in identifying gaps.
```

### 5.2 Agent Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resume Scoring Agent                          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Input     │───▶│   Analyze    │───▶│   Match      │      │
│  │  Validation  │    │   Resume     │    │   Skills     │      │
│  └──────────────┘    └──────────────┘    └──────┬───────┘      │
│                                                  │               │
│                                                  ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Generate   │◀───│   Combine    │◀───│   Evaluate   │      │
│  │  Explanation │    │   Scores     │    │  Experience  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │    Bias      │                                               │
│  │    Check     │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target | Maximum |
|--------|--------|---------|
| Resume upload (API response) | < 2s | 5s |
| Resume parsing | < 15s | 30s |
| Resume scoring | < 5s | 15s |
| Search query | < 1s | 3s |
| Bulk upload (50 files) | < 5min | 10min |

### 6.2 Scalability

- Support 10,000 resume uploads per day per tenant
- Support 100 concurrent scoring operations
- Support 1 million indexed resumes per tenant

### 6.3 Availability

- 99.9% uptime for API endpoints
- Graceful degradation when AI services unavailable
- Queue-based processing for resilience

---

## 7. Integration Points

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| Candidates Service | REST API | Candidate profile management |
| Jobs Service | REST API | Job requirements retrieval |
| Azure Blob Storage | SDK | Document storage |
| Azure Cognitive Search | SDK | Semantic search |
| Microsoft Foundry | SDK | AI agent orchestration |
| Azure OpenAI | SDK | LLM capabilities |
| Azure Form Recognizer | SDK | OCR and document parsing |
| Service Bus | SDK | Async processing |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial specification |

