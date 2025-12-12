# HireFit Platform Architecture Overview

## Executive Summary

HireFit is an enterprise-grade, AI-enabled talent acquisition platform built on Microsoft Azure. This document provides a comprehensive overview of the system architecture, component interactions, and key design decisions.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXPERIENCE LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js Frontend (Azure Static Web Apps)              │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │   │
│  │   │  HR Admin    │  │   Recruiter  │  │   Hiring     │  │ Candidate  │   │   │
│  │   │  Console     │  │   Dashboard  │  │   Manager    │  │   Portal   │   │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              GATEWAY LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Azure Front Door + WAF                                 │   │
│  │        (Global Load Balancing, DDoS Protection, SSL Termination)         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Azure API Management                                   │   │
│  │           (Rate Limiting, Authentication, API Versioning)                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │               Azure Container Apps / AKS (NestJS Backend)                 │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │  │
│  │  │   Auth     │ │   Jobs     │ │ Candidates │ │ Evaluation │            │  │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │            │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │  │
│  │  │  Resume    │ │ Monetize   │ │  Tenant    │ │   Audit    │            │  │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │            │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
┌───────────────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐
│      AI SERVICES LAYER    │ │  MESSAGING      │ │       DATA LAYER            │
│ ┌───────────────────────┐ │ │    LAYER        │ │ ┌───────────────────────┐   │
│ │  Microsoft Foundry    │ │ │ ┌─────────────┐ │ │ │   Azure SQL Database  │   │
│ │  ┌─────────────────┐  │ │ │ │   Azure     │ │ │ │   (Primary Data)      │   │
│ │  │ Resume Scoring  │  │ │ │ │  Service    │ │ │ └───────────────────────┘   │
│ │  │     Agent       │  │ │ │ │    Bus      │ │ │ ┌───────────────────────┐   │
│ │  └─────────────────┘  │ │ │ └─────────────┘ │ │ │  Azure Blob Storage   │   │
│ │  ┌─────────────────┐  │ │ │ ┌─────────────┐ │ │ │   (Documents)         │   │
│ │  │ Question Gen    │  │ │ │ │   Azure     │ │ │ └───────────────────────┘   │
│ │  │     Agent       │  │ │ │ │   Cache     │ │ │ ┌───────────────────────┐   │
│ │  └─────────────────┘  │ │ │ │  (Redis)    │ │ │ │ Azure Cognitive Search│   │
│ │  ┌─────────────────┐  │ │ │ └─────────────┘ │ │ │   (Semantic Search)   │   │
│ │  │ Candidate Match │  │ │ └─────────────────┘ │ └───────────────────────────┘
│ │  │     Agent       │  │ │                     │
│ │  └─────────────────┘  │ │                     │
│ └───────────────────────┘ │                     │
│ ┌───────────────────────┐ │                     │
│ │   Azure OpenAI        │ │                     │
│ │   (LLM Backend)       │ │                     │
│ └───────────────────────┘ │                     │
└───────────────────────────┘                     │
                                                  │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM SERVICES                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│  │  Azure AD    │ │ Azure Key    │ │Azure Monitor │ │  Azure DevOps        │   │
│  │  (Identity)  │ │   Vault      │ │(Observability│ │  (CI/CD)             │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Details

### 2.1 Experience Layer

#### Next.js Frontend
- **Technology**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query + Zustand
- **Hosting**: Azure Static Web Apps with CDN
- **Authentication**: MSAL.js for Azure AD integration

#### Application Portals
| Portal | Purpose | Primary Users |
|--------|---------|---------------|
| HR Admin Console | Platform configuration, user management, compliance | HR Administrators |
| Recruiter Dashboard | Candidate pipeline, screening, scheduling | Recruiters |
| Hiring Manager Portal | Job creation, candidate review, evaluations | Hiring Managers |
| Candidate Portal | Application tracking, interview scheduling | Candidates |

### 2.2 Gateway Layer

#### Azure Front Door
- Global load balancing across regions
- SSL/TLS termination
- DDoS protection (L3/L4)
- Web Application Firewall (WAF)
- Custom domain management

#### Azure API Management
- API versioning and lifecycle management
- Rate limiting and throttling
- Request/response transformation
- API analytics and monitoring
- Developer portal for API documentation

### 2.3 Application Layer

#### NestJS Backend Services
- **Framework**: NestJS with TypeScript
- **Hosting**: Azure Container Apps (serverless containers)
- **Scaling**: Event-driven autoscaling (KEDA)

| Service | Responsibility | Key Dependencies |
|---------|---------------|------------------|
| Auth Service | Authentication, authorization, session management | Azure AD, Redis |
| Jobs Service | Job posting CRUD, requirements management | SQL Database, Features Service |
| Candidates Service | Candidate profiles, applications, status tracking | SQL Database, Blob Storage |
| Evaluation Service | Interview management, scoring, feedback | SQL Database, AI Services |
| Resume Service | Resume parsing, storage, AI scoring | Blob Storage, Foundry, Features Service |
| Features Service | Modular feature flags, usage limits, tier management | SQL Database, Redis |
| Usage Service | Usage tracking, limit enforcement, metering | SQL Database, Features Service |
| Tenant Service | Multi-tenancy, organization settings, workspace management | SQL Database, Features Service |
| Audit Service | Audit logging, compliance reporting | SQL Database, Log Analytics |

### 2.4 AI Services Layer

#### Microsoft Foundry
- **Purpose**: AI agent orchestration and workflow management
- **Agents**:
  - Resume Scoring Agent: Analyzes resumes against job requirements
  - Question Generation Agent: Creates interview questions
  - Candidate Matching Agent: Matches candidates to jobs
  - Bias Detection Agent: Monitors for fairness issues

#### Azure OpenAI
- **Models**: GPT-4 for complex reasoning, GPT-3.5-turbo for speed-sensitive tasks
- **Use Cases**: Resume analysis, question generation, summarization
- **Controls**: Content filtering, rate limiting, cost management

### 2.5 Data Layer

#### Azure SQL Database
- **Tier**: Business Critical for production
- **Features**: Row-level security, Always Encrypted, geo-replication
- **Schema**: Multi-tenant with tenant isolation

#### Azure Blob Storage
- **Purpose**: Document storage (resumes, attachments, exports)
- **Features**: Hierarchical namespace, lifecycle management, soft delete
- **Security**: SAS tokens, encryption at rest, Azure Defender

#### Azure Cognitive Search
- **Purpose**: Semantic search across candidates and jobs
- **Features**: Vector search, semantic ranking, faceted search
- **Integration**: Real-time indexing from SQL and Blob Storage

### 2.6 Messaging Layer

#### Azure Service Bus
- **Purpose**: Asynchronous job processing, event-driven workflows
- **Topics**: resume-processing, evaluation-completed, notification-send
- **Features**: Dead letter queues, scheduled delivery, sessions

#### Azure Cache for Redis
- **Purpose**: Session caching, rate limiting, feature flags
- **Features**: Cluster mode, geo-replication, persistence

---

## 3. Data Flow Diagrams

### 3.1 Resume Upload and Processing

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐
│ Recruiter│───▶│ Frontend │───▶│ API Gateway  │───▶│   Resume    │
│          │    │          │    │              │    │   Service   │
└──────────┘    └──────────┘    └──────────────┘    └──────┬──────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────────────┐
                    │                                     │                 │
                    ▼                                     ▼                 ▼
             ┌─────────────┐                    ┌─────────────┐    ┌────────────┐
             │    Blob     │                    │   Service   │    │    SQL     │
             │   Storage   │                    │     Bus     │    │  Database  │
             │  (Resume)   │                    │   (Queue)   │    │ (Metadata) │
             └─────────────┘                    └──────┬──────┘    └────────────┘
                                                      │
                                                      ▼
                                               ┌─────────────┐
                                               │  Microsoft  │
                                               │   Foundry   │
                                               │   (Agent)   │
                                               └──────┬──────┘
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    │                 │                 │
                                    ▼                 ▼                 ▼
                             ┌─────────────┐  ┌─────────────┐   ┌─────────────┐
                             │   Azure     │  │  Cognitive  │   │    SQL      │
                             │   OpenAI    │  │   Search    │   │  (Scores)   │
                             │  (Analyze)  │  │  (Index)    │   │             │
                             └─────────────┘  └─────────────┘   └─────────────┘
```

### 3.2 Candidate Evaluation Flow

```
┌──────────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐
│   Hiring     │───▶│ Frontend │───▶│ API Gateway  │───▶│ Evaluation  │
│   Manager    │    │          │    │              │    │   Service   │
└──────────────┘    └──────────┘    └──────────────┘    └──────┬──────┘
                                                               │
              ┌────────────────────────────────────────────────┼────────────┐
              │                                                │            │
              ▼                                                ▼            ▼
       ┌─────────────┐                                  ┌───────────┐  ┌────────┐
       │  Microsoft  │                                  │    SQL    │  │ Redis  │
       │   Foundry   │                                  │ Database  │  │(Cache) │
       │  (Question  │                                  │           │  │        │
       │    Agent)   │                                  └───────────┘  └────────┘
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │   Azure     │
       │   OpenAI    │
       └─────────────┘
```

---

## 4. Multi-Tenancy Architecture

### 4.1 Individual-First Workspace Model

HireFit uses an **individual-first** approach where personal workspaces are the primary entry point, with team/company workspaces as an upgrade path:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Individual  │───▶│   Convert    │───▶│     Company      │   │
│  │   Signup     │    │  to Company  │    │    Workspace     │   │
│  │  (Free)      │    │   (Upgrade)  │    │    (Team)        │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│                                                                  │
│  Personal Workspace    Same Data           Add Team Members      │
│  Free Tier Limits      Preserved           Increased Limits      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Workspace Types

| Type | Primary User | Use Case | Team Size |
|------|-------------|----------|-----------|
| Personal | Individual HR professional | Freelance recruiting, consultants | 1 |
| Company | Teams/Organizations | Collaborative hiring | 2+ |

#### Pricing Tiers

| Tier | Type | Jobs | Candidates | AI Scores/mo | Team |
|------|------|------|------------|--------------|------|
| Free | Personal | 3 | 50 | 20 | 1 |
| Pro | Personal | 10 | 500 | 100 | 1 |
| Team | Company | 50 | 2,000 | 500 | 5 |
| Enterprise | Company | Unlimited | Unlimited | Unlimited | Unlimited |

### 4.2 Tenant Isolation Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                   (Tenant ID Extraction)                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Services                          │
│              (Tenant Context Middleware)                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           ▼                      ▼                      ▼
    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
    │  SQL DB     │       │    Blob     │       │   Search    │
    │  (RLS)      │       │  (Prefix)   │       │  (Filter)   │
    └─────────────┘       └─────────────┘       └─────────────┘

    Tenant A Data          /tenant-a/*          filter: tenantId=A
    Tenant B Data          /tenant-b/*          filter: tenantId=B
    Tenant C Data          /tenant-c/*          filter: tenantId=C
```

### 4.3 Isolation Mechanisms

| Layer | Isolation Method | Implementation |
|-------|-----------------|----------------|
| Database | Row-Level Security (RLS) | Policy-based filtering on tenant_id |
| Blob Storage | Container/Path Prefix | `/{tenant-id}/` prefix for all paths |
| Search Index | Filter on tenant_id | Mandatory filter in all queries |
| Cache | Key Prefix | `{tenant-id}:` prefix for all keys |
| Logs | Tenant ID Tag | Custom dimension in all log entries |

---

## 5. Modular Feature System

HireFit implements a modular feature architecture enabling flexible monetization, A/B testing, and gradual rollouts.

### 5.1 Feature Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FEATURE SYSTEM ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Feature Definition Table                    │    │
│  │  ┌──────────┬─────────┬────────────┬─────────────────┐ │    │
│  │  │ core     │ standard│ Always On  │ No Limit        │ │    │
│  │  │ ai_screen│ freemium│ Enabled    │ 20/mo (free)    │ │    │
│  │  │ ai_intv  │ premium │ Disabled   │ 10/mo           │ │    │
│  │  │ scheduler│ addon   │ Disabled   │ No Limit        │ │    │
│  │  │ analytics│ premium │ Disabled   │ No Limit        │ │    │
│  │  │ integrat │ enterpr.│ Disabled   │ No Limit        │ │    │
│  │  └──────────┴─────────┴────────────┴─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Tenant Feature Table                        │    │
│  │  ┌──────────┬───────────┬─────────┬──────────────────┐ │    │
│  │  │ Tenant A │ ai_screen │ Enabled │ Used: 15/20      │ │    │
│  │  │ Tenant A │ scheduler │ Enabled │ No Limit         │ │    │
│  │  │ Tenant B │ ai_screen │ Enabled │ Used: 80/100     │ │    │
│  │  │ Tenant B │ analytics │ Enabled │ No Limit         │ │    │
│  │  └──────────┴───────────┴─────────┴──────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Feature Categories

| ID | Module | Type | Default | Description |
|----|--------|------|---------|-------------|
| `core` | Core Platform | Standard | Always On | Jobs, Candidates, Resume Management |
| `ai_screening` | AI Resume Screening | Freemium | Limited Free | AI parsing, scoring against job requirements |
| `ai_interview` | AI Interview Eval | Premium | Off | AI-assisted interview evaluation |
| `scheduler` | Interview Scheduler | Add-on | Off | Calendar integration, scheduling |
| `analytics` | Advanced Analytics | Premium | Off | Hiring metrics, reports |
| `integrations` | ATS/HRIS Integrations | Enterprise | Off | External system connections |

### 5.3 Tier to Feature Mapping

| Tier | Included Features | Usage Limits |
|------|------------------|--------------|
| Free | `core`, `ai_screening` | ai_screening: 20/month |
| Pro | Free + `scheduler` | ai_screening: 100/month |
| Team | Pro + `analytics`, `ai_interview` | ai_screening: 500/month, ai_interview: 50/month |
| Enterprise | All Features | Unlimited |

### 5.4 Feature Guard Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Request    │───▶│ @RequireFeature │───▶│  Feature     │
│  (Endpoint)  │    │   Decorator  │    │   Guard      │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Features    │───▶ Is Enabled?
                                        │   Service    │───▶ Within Limit?
                                        └──────┬───────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                   ┌──────────┐         ┌──────────┐         ┌──────────┐
                   │ Allow    │         │ Deny +   │         │ Increment│
                   │ Access   │         │ Upgrade  │         │ Usage    │
                   │          │         │ Prompt   │         │ Counter  │
                   └──────────┘         └──────────┘         └──────────┘
```

### 5.5 Frontend Feature Gating

```tsx
// Feature-gated component
<FeatureGate feature="ai_screening">
  <AIScreeningPanel />
</FeatureGate>

// Feature usage bar
<FeatureUsageBar feature="ai_screening" />

// Conditional rendering
const { canUse, usage } = useFeature('ai_screening');
if (!canUse) return <UpgradePrompt />;
```

---

## 6. Security Architecture

### 6.1 Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐
│   User   │───▶│ Frontend │───▶│   Azure AD   │───▶│   Token     │
│          │◀───│          │◀───│   (OIDC)     │◀───│   Issued    │
└──────────┘    └──────────┘    └──────────────┘    └─────────────┘
                     │
                     │ JWT Token
                     ▼
              ┌─────────────┐
              │ API Gateway │
              │  (Validate) │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  Backend    │
              │ (Authorize) │
              └─────────────┘
```

### 6.2 Authorization Model

- **RBAC**: Role-based permissions aligned with personas
- **ABAC**: Attribute-based rules for fine-grained control
- **Resource-level**: Ownership and sharing permissions

### 6.3 Encryption Strategy

| Data State | Method | Key Management |
|------------|--------|----------------|
| At Rest (SQL) | TDE + Always Encrypted | Azure Key Vault |
| At Rest (Blob) | AES-256 | Platform-managed or CMK |
| In Transit | TLS 1.3 | Azure-managed certificates |
| Application | Field-level encryption | Azure Key Vault |

---

## 7. Scalability Architecture

### 7.1 Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Front Door                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌───────────┐
       │  Region   │  │  Region   │  │  Region   │
       │   East    │  │   West    │  │  Europe   │
       └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
             │              │              │
       ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
       │ Container │  │ Container │  │ Container │
       │   Apps    │  │   Apps    │  │   Apps    │
       │  (Auto-   │  │  (Auto-   │  │  (Auto-   │
       │  scale)   │  │  scale)   │  │  scale)   │
       └───────────┘  └───────────┘  └───────────┘
```

### 7.2 Scaling Triggers

| Component | Metric | Scale Out | Scale In |
|-----------|--------|-----------|----------|
| Container Apps | CPU | > 70% | < 30% |
| Container Apps | Memory | > 80% | < 40% |
| Container Apps | HTTP Requests | > 1000/s | < 200/s |
| Service Bus | Queue Length | > 1000 | < 100 |
| SQL Database | DTU | > 80% | Auto (Serverless) |

---

## 8. Observability Architecture

### 8.1 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Monitor                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Application Insights                     │    │
│  │   (APM, Distributed Tracing, Live Metrics)              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Log Analytics                          │    │
│  │   (Centralized Logging, KQL Queries, Alerts)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Azure Workbooks                        │    │
│  │   (Dashboards, Reports, Visualizations)                 │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Metrics

- **Availability**: Uptime, error rates, response times
- **Performance**: Latency percentiles, throughput, saturation
- **Business**: Applications processed, candidates screened, evaluations completed
- **AI**: Model latency, accuracy, bias metrics

---

## 9. Disaster Recovery

### 9.1 RPO/RTO Targets

| Tier | RPO | RTO | Components |
|------|-----|-----|------------|
| Critical | 5 min | 1 hour | SQL Database, Key Vault |
| High | 15 min | 4 hours | Blob Storage, Service Bus |
| Medium | 1 hour | 8 hours | Search Index, Cache |
| Low | 24 hours | 24 hours | Analytics, Logs |

### 9.2 DR Strategy

- **SQL Database**: Active geo-replication with auto-failover groups
- **Blob Storage**: GRS (Geo-Redundant Storage) with failover capability
- **Container Apps**: Multi-region deployment with Front Door routing
- **Key Vault**: Soft delete and purge protection enabled

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial architecture |

**Review Schedule**: Quarterly or after major changes

