# Candidate Evaluation Hub - Functional Specification

## Overview

The Candidate Evaluation Hub provides structured interview management, collaborative scoring, and comprehensive feedback workflows. It enables hiring teams to conduct consistent, bias-aware evaluations with full audit trails.

---

## 1. Module Scope

### 1.1 Core Capabilities

| Capability | Description | Priority |
|------------|-------------|----------|
| Interview Scheduling | Coordinate interviews with calendar integration | P0 |
| Structured Interviews | Question banks and interview guides | P0 |
| Evaluation Forms | Configurable scoring rubrics and forms | P0 |
| Collaborative Review | Team-based evaluation and discussion | P0 |
| Feedback Collection | Structured feedback from interviewers | P0 |
| Decision Workflow | Hiring decision tracking and approvals | P1 |
| Interview Recording | Optional video/audio recording | P1 |
| AI-Assisted Evaluation | Question suggestions, note summarization | P1 |

### 1.2 Out of Scope (Phase 1)

- Live interview platform (video conferencing)
- Automated coding assessments
- Background check integration
- Offer letter generation

---

## 2. Functional Requirements

### 2.1 Interview Management

#### FR-EVAL-001: Interview Scheduling
**Description**: System shall enable scheduling of interviews with participants.

**Acceptance Criteria**:
- Create interview with candidate, interviewers, type, duration
- Check interviewer availability (calendar integration)
- Send calendar invitations automatically
- Support multiple interview rounds
- Support panel interviews (multiple interviewers)
- Allow rescheduling and cancellation
- Send reminders before interviews
- Track interview completion status

#### FR-EVAL-002: Interview Types
**Description**: System shall support different interview types.

**Interview Types**:
| Type | Description | Default Duration |
|------|-------------|------------------|
| Phone Screen | Initial phone/video screening | 30 min |
| Technical | Skills-based technical assessment | 60 min |
| Behavioral | Soft skills and culture fit | 45 min |
| Case Study | Problem-solving assessment | 60 min |
| Panel | Multiple interviewers | 60 min |
| Executive | Senior leadership discussion | 45 min |
| On-site | Full-day multi-interview | 4-6 hours |

**Acceptance Criteria**:
- Configure interview types per tenant
- Associate question banks with interview types
- Define evaluation criteria per type
- Set default duration and participants

#### FR-EVAL-003: Interview Pipeline
**Description**: System shall manage candidate progression through interview stages.

**Pipeline Flow**:
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Applied    │───▶│   Screen     │───▶│  Interview   │───▶│   Offer      │
│              │    │              │    │   Rounds     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
  │ Reject  │        │ Reject  │        │ Reject  │        │ Decline │
  └─────────┘        └─────────┘        └─────────┘        └─────────┘
```

**Acceptance Criteria**:
- Define configurable pipeline stages per job
- Track time in each stage
- Support parallel interview tracks
- Automate stage transitions based on scores
- Generate pipeline analytics

### 2.2 Question Banks

#### FR-EVAL-004: Question Library
**Description**: System shall maintain a library of interview questions.

**Question Attributes**:
- Question text
- Category (technical, behavioral, situational)
- Competency being assessed
- Difficulty level
- Expected answer guidelines
- Follow-up questions
- Time estimate
- Usage statistics

**Acceptance Criteria**:
- Create, edit, delete questions
- Organize questions by category and competency
- Search questions by keyword
- Import questions from templates
- Track question effectiveness
- Support tenant-specific and global questions

#### FR-EVAL-005: AI Question Generation
**Description**: System shall suggest interview questions using AI.

**Acceptance Criteria**:
- Generate questions from job requirements
- Generate questions from candidate resume
- Suggest follow-up questions
- Avoid duplicate questions across rounds
- Rate question relevance
- Support question customization

#### FR-EVAL-006: Interview Guides
**Description**: System shall provide structured interview guides.

**Guide Components**:
- Introduction script
- Question sequence
- Evaluation criteria for each question
- Time allocation
- Note-taking prompts
- Closing script

**Acceptance Criteria**:
- Create interview guide templates
- Associate guides with interview types
- Allow guide customization per interview
- Support real-time guide navigation
- Enable guide sharing and collaboration

### 2.3 Evaluation & Scoring

#### FR-EVAL-007: Evaluation Forms
**Description**: System shall provide configurable evaluation forms.

**Form Elements**:
- Rating scales (1-5, 1-10, custom)
- Competency-based scoring
- Written feedback sections
- Recommendation field
- Strengths and concerns
- Red flags indicator

**Acceptance Criteria**:
- Create custom evaluation forms
- Support different forms per interview type
- Require mandatory fields
- Auto-save progress
- Submit within time limit (optional)
- Lock form after submission

#### FR-EVAL-008: Scoring Rubrics
**Description**: System shall provide scoring guidance for consistency.

**Rubric Structure**:
```typescript
interface ScoringRubric {
  competency: string;
  levels: {
    score: number;
    label: string;
    description: string;
    examples: string[];
  }[];
}

// Example
const technicalCompetencyRubric: ScoringRubric = {
  competency: "Technical Problem Solving",
  levels: [
    {
      score: 1,
      label: "Does Not Meet",
      description: "Unable to approach problem systematically",
      examples: ["No clear methodology", "Cannot explain reasoning"]
    },
    {
      score: 3,
      label: "Meets Expectations",
      description: "Demonstrates structured problem-solving approach",
      examples: ["Breaks down problem", "Considers edge cases"]
    },
    {
      score: 5,
      label: "Exceeds Expectations",
      description: "Exceptional problem-solving with innovative approaches",
      examples: ["Optimal solution", "Teaches interviewer something new"]
    }
  ]
};
```

**Acceptance Criteria**:
- Define rubrics per competency
- Display rubric during evaluation
- Enforce score justification for extreme ratings
- Track calibration metrics
- Generate scoring guidelines

#### FR-EVAL-009: Bias Checks
**Description**: System shall monitor and flag potential evaluation bias.

**Bias Indicators**:
- Scoring outliers vs team average
- Inconsistent scoring patterns
- Protected characteristic correlation
- Time-based scoring patterns
- Language analysis in feedback

**Acceptance Criteria**:
- Alert reviewers to potential bias
- Require justification for outlier scores
- Generate bias reports for hiring managers
- Support blind evaluation mode (optional)
- Track interviewer calibration scores

### 2.4 Collaboration & Decision Making

#### FR-EVAL-010: Team Scorecard
**Description**: System shall aggregate evaluations into team scorecard.

**Scorecard Features**:
- Combined scores across interviewers
- Score distribution visualization
- Consensus indicators
- Highlight disagreements
- Competency heat map

**Acceptance Criteria**:
- Auto-generate scorecard after all interviews
- Show individual and aggregate scores
- Identify score variances
- Compare candidates side-by-side
- Export scorecard as PDF

#### FR-EVAL-011: Debrief Workflow
**Description**: System shall facilitate hiring team debrief sessions.

**Debrief Features**:
- Structured agenda
- Round-robin feedback sharing
- Discussion thread for each candidate
- Anonymous initial voting (optional)
- Decision capture and documentation

**Acceptance Criteria**:
- Schedule debrief meetings
- Guide debrief discussion
- Capture decision and reasoning
- Lock evaluations before debrief (configurable)
- Track debrief outcomes

#### FR-EVAL-012: Hiring Decision
**Description**: System shall capture and track hiring decisions.

**Decision States**:
- Advance to next round
- Hire
- No hire
- Hold
- Withdraw

**Acceptance Criteria**:
- Require decision with justification
- Support approval workflows
- Notify relevant stakeholders
- Update candidate status
- Maintain decision audit trail

### 2.5 Recording & Notes

#### FR-EVAL-013: Interview Notes
**Description**: System shall capture interview notes.

**Note Features**:
- Rich text editor
- Time-stamped notes
- Question-linked notes
- Voice-to-text (optional)
- Note templates

**Acceptance Criteria**:
- Real-time note saving
- Private vs shared notes
- Search across notes
- Attach to evaluation
- Export notes

#### FR-EVAL-014: Interview Recording
**Description**: System shall support optional interview recording.

**Recording Features**:
- Video/audio recording
- Consent capture
- Secure storage
- Playback with transcript
- Highlight marking

**Acceptance Criteria**:
- Require consent before recording
- Store recordings securely (encrypted)
- Enforce retention policies
- Limit access to authorized users
- Support recording deletion requests

#### FR-EVAL-015: AI Note Summarization
**Description**: System shall generate summaries from interview notes.

**Acceptance Criteria**:
- Generate concise summary
- Extract key discussion points
- Identify candidate strengths
- Flag concerns mentioned
- Maintain factual accuracy

---

## 3. Data Model

### 3.1 Core Entities

```typescript
// Interview
interface Interview {
  id: string;
  tenantId: string;
  
  // References
  candidateId: string;
  jobId: string;
  applicationId: string;
  
  // Schedule
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt?: Date;
  duration: number;  // minutes
  location?: string;
  meetingLink?: string;
  
  // Participants
  interviewers: InterviewParticipant[];
  
  // Guide
  interviewGuideId?: string;
  questionSequence?: string[];  // Question IDs
  
  // Results
  evaluations: Evaluation[];
  recording?: Recording;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

type InterviewType = 
  | 'phone_screen' 
  | 'technical' 
  | 'behavioral' 
  | 'case_study' 
  | 'panel' 
  | 'executive' 
  | 'onsite';

type InterviewStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

interface InterviewParticipant {
  userId: string;
  role: 'lead' | 'participant' | 'observer';
  status: 'pending' | 'accepted' | 'declined';
  evaluationId?: string;
}

// Evaluation
interface Evaluation {
  id: string;
  tenantId: string;
  interviewId: string;
  evaluatorId: string;
  
  // Scores
  overallScore: number;
  recommendation: Recommendation;
  competencyScores: CompetencyScore[];
  
  // Feedback
  strengths: string[];
  concerns: string[];
  notes: string;
  redFlags: string[];
  
  // Status
  status: 'draft' | 'submitted' | 'locked';
  submittedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

type Recommendation = 
  | 'strong_hire' 
  | 'hire' 
  | 'no_hire' 
  | 'strong_no_hire' 
  | 'undecided';

interface CompetencyScore {
  competencyId: string;
  competencyName: string;
  score: number;
  maxScore: number;
  notes?: string;
}

// Interview Guide
interface InterviewGuide {
  id: string;
  tenantId: string;
  
  name: string;
  description: string;
  interviewType: InterviewType;
  
  sections: GuideSection[];
  
  estimatedDuration: number;
  isTemplate: boolean;
  
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

interface GuideSection {
  name: string;
  duration: number;
  instructions: string;
  questions: GuideQuestion[];
}

interface GuideQuestion {
  questionId: string;
  questionText: string;
  followUps: string[];
  evaluationCriteria: string;
  timeAllocation: number;
}

// Question Bank
interface Question {
  id: string;
  tenantId: string;
  
  text: string;
  category: QuestionCategory;
  competency: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  answerGuidelines?: string;
  followUpQuestions: string[];
  
  tags: string[];
  usageCount: number;
  avgScore: number;
  
  isGlobal: boolean;  // System-wide vs tenant-specific
  
  createdAt: Date;
  createdBy: string;
}

type QuestionCategory = 
  | 'technical' 
  | 'behavioral' 
  | 'situational' 
  | 'experience' 
  | 'motivation';

// Hiring Decision
interface HiringDecision {
  id: string;
  tenantId: string;
  
  candidateId: string;
  jobId: string;
  applicationId: string;
  
  decision: Decision;
  rationale: string;
  
  interviewScores: {
    interviewId: string;
    avgScore: number;
    recommendation: Recommendation;
  }[];
  
  decisionMaker: string;
  approvers?: {
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp?: Date;
    comments?: string;
  }[];
  
  effectiveDate: Date;
  createdAt: Date;
}

type Decision = 
  | 'hire' 
  | 'no_hire' 
  | 'advance' 
  | 'hold' 
  | 'withdraw';
```

### 3.2 Database Schema

```sql
-- Interviews table
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    interview_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    
    interview_guide_id UUID REFERENCES interview_guides(id),
    question_sequence UUID[],
    
    recording_consent BOOLEAN DEFAULT FALSE,
    recording_path VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Interview participants
CREATE TABLE interview_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL DEFAULT 'participant',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    calendar_event_id VARCHAR(255),
    
    UNIQUE(interview_id, user_id)
);

-- Evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    interview_id UUID NOT NULL REFERENCES interviews(id),
    evaluator_id UUID NOT NULL REFERENCES users(id),
    
    overall_score DECIMAL(3,1),
    recommendation VARCHAR(20),
    
    strengths TEXT[],
    concerns TEXT[],
    notes TEXT,
    red_flags TEXT[],
    
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(interview_id, evaluator_id)
);

-- Competency scores
CREATE TABLE competency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL,
    competency_name VARCHAR(100) NOT NULL,
    score DECIMAL(3,1) NOT NULL,
    max_score DECIMAL(3,1) NOT NULL DEFAULT 5,
    notes TEXT
);

-- Question bank
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL for global questions
    
    text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    competency VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    
    answer_guidelines TEXT,
    follow_up_questions TEXT[],
    
    tags VARCHAR(50)[],
    usage_count INTEGER NOT NULL DEFAULT 0,
    avg_score DECIMAL(3,2),
    
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Interview guides
CREATE TABLE interview_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interview_type VARCHAR(50) NOT NULL,
    
    sections JSONB NOT NULL DEFAULT '[]',
    
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_template BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Hiring decisions
CREATE TABLE hiring_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    
    decision VARCHAR(20) NOT NULL,
    rationale TEXT NOT NULL,
    
    interview_scores JSONB,
    
    decision_maker UUID NOT NULL REFERENCES users(id),
    approvers JSONB,
    
    effective_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(application_id)
);

-- Row-level security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY interviews_tenant_isolation ON interviews
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY evaluations_tenant_isolation ON evaluations
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY hiring_decisions_tenant_isolation ON hiring_decisions
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 4. API Specification

### 4.1 Interview Management

```yaml
# Create interview
POST /api/v1/interviews
Request:
  candidateId: string
  jobId: string
  type: InterviewType
  scheduledAt: string (ISO 8601)
  duration: number (minutes)
  interviewers: { userId: string, role: string }[]
  interviewGuideId?: string
  location?: string
  meetingLink?: string

Response (201):
  id: string
  status: "scheduled"
  calendarEventsCreated: boolean

# Get interview
GET /api/v1/interviews/{id}
Response (200):
  id: string
  candidate: CandidateSummary
  job: JobSummary
  type: string
  status: string
  scheduledAt: string
  duration: number
  interviewers: InterviewParticipant[]
  guide?: InterviewGuide
  evaluations: EvaluationSummary[]

# Update interview status
PATCH /api/v1/interviews/{id}/status
Request:
  status: InterviewStatus
  reason?: string
Response (200):
  id: string
  status: string
  updatedAt: string

# List interviews (for user)
GET /api/v1/interviews?candidateId=&jobId=&status=&startDate=&endDate=
Response (200):
  interviews: Interview[]
  pagination: { page, pageSize, total }
```

### 4.2 Evaluations

```yaml
# Start evaluation
POST /api/v1/evaluations
Request:
  interviewId: string
Response (201):
  id: string
  status: "draft"
  form: EvaluationForm

# Update evaluation (auto-save)
PATCH /api/v1/evaluations/{id}
Request:
  overallScore?: number
  recommendation?: string
  competencyScores?: CompetencyScore[]
  strengths?: string[]
  concerns?: string[]
  notes?: string
Response (200):
  id: string
  updatedAt: string

# Submit evaluation
POST /api/v1/evaluations/{id}/submit
Response (200):
  id: string
  status: "submitted"
  submittedAt: string

# Get team scorecard
GET /api/v1/interviews/{interviewId}/scorecard
Response (200):
  candidate: CandidateSummary
  evaluations: Evaluation[]
  aggregateScores:
    overall: { avg, min, max, stdDev }
    byCompetency: { competency, avg, min, max }[]
  consensus: "strong" | "moderate" | "weak"
  recommendations: { recommendation, count }[]
```

### 4.3 Questions & Guides

```yaml
# Search questions
GET /api/v1/questions?category=&competency=&difficulty=&search=
Response (200):
  questions: Question[]
  pagination: { page, pageSize, total }

# Generate questions (AI)
POST /api/v1/questions/generate
Request:
  jobId: string
  candidateId?: string
  category: QuestionCategory
  count: number
Response (200):
  questions: GeneratedQuestion[]

# Create interview guide
POST /api/v1/interview-guides
Request:
  name: string
  interviewType: string
  sections: GuideSection[]
Response (201):
  id: string
  ...
```

### 4.4 Hiring Decisions

```yaml
# Record decision
POST /api/v1/hiring-decisions
Request:
  candidateId: string
  jobId: string
  applicationId: string
  decision: Decision
  rationale: string
  effectiveDate?: string
Response (201):
  id: string
  status: "pending_approval" | "final"
  approvalRequired: boolean

# Approve decision
POST /api/v1/hiring-decisions/{id}/approve
Request:
  approved: boolean
  comments?: string
Response (200):
  id: string
  approvalStatus: string
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target | Maximum |
|--------|--------|---------|
| Schedule interview | < 3s | 5s |
| Load evaluation form | < 1s | 2s |
| Auto-save evaluation | < 500ms | 1s |
| Generate scorecard | < 2s | 5s |
| AI question generation | < 5s | 15s |

### 5.2 Availability

- 99.9% uptime for interview scheduling
- Offline support for evaluation submission
- Graceful degradation for AI features

### 5.3 Data Integrity

- No data loss on evaluation auto-save
- Conflict resolution for concurrent edits
- Full audit trail for all changes

---

## 6. Integration Points

| System | Integration | Purpose |
|--------|-------------|---------|
| Calendar (O365/Google) | OAuth + Graph/Calendar API | Schedule sync |
| Video (Teams/Zoom) | API | Meeting link generation |
| Candidates Service | REST API | Candidate data |
| Jobs Service | REST API | Job requirements |
| Resume Service | REST API | Resume for review |
| Microsoft Foundry | SDK | AI question generation |
| Notification Service | Event | Interview reminders |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial specification |

