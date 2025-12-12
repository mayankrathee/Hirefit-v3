# HireFit Platform Roadmap

## Overview

This roadmap outlines the phased delivery plan for the HireFit AI-enabled talent acquisition platform. Each phase builds upon the previous, with defined milestones, checkpoints, and success criteria.

---

## Roadmap Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              HIREFIT PLATFORM ROADMAP                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  Phase 0          Phase 1          Phase 2          Phase 3          Phase 4            │
│  FOUNDATION       MVP              COLLABORATION    MONETIZATION     ADVANCED AI        │
│  8 weeks          10 weeks         8 weeks          8 weeks          10 weeks           │
│                                                                                          │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐       │
│  │ Infra   │      │ Resume  │      │ Evalua- │      │ Billing │      │ Predict │       │
│  │ Auth    │─────▶│ Screen  │─────▶│ tions   │─────▶│ Feature │─────▶│ Models  │       │
│  │ Tenant  │      │ Admin   │      │ Collab  │      │ Flags   │      │ Bias    │       │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘      └─────────┘       │
│                                                                                          │
│  Q1 2024          Q2 2024          Q3 2024          Q4 2024          Q1 2025            │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Foundation (8 weeks) ✅ COMPLETED

### Objective
Establish core infrastructure, authentication, and multi-tenant architecture as the foundation for all future development.

### Timeline
**Start**: Week 1
**End**: Week 8
**Duration**: 8 weeks
**Status**: ✅ COMPLETED

### Milestones

#### M0.1: Infrastructure Setup (Weeks 1-2) ✅
- [x] Monorepo structure with Turborepo
- [x] NestJS backend with modular architecture
- [x] Next.js frontend with App Router
- [x] Prisma ORM with SQLite (dev) / Azure SQL (prod)
- [x] Local development environment configured
- [x] CI/CD pipeline ready

**Deliverables**:
- ✅ Monorepo project structure
- ✅ Development environment setup
- ✅ Package configuration

#### M0.2: Authentication & Identity (Weeks 3-4) ✅
- [x] JWT token handling in backend
- [x] Demo authentication for development
- [x] Azure AD integration prepared
- [x] Session management implementation

**Deliverables**:
- ✅ Authentication service
- ✅ Demo login flow
- ✅ JWT strategy

#### M0.3: Multi-Tenant Foundation (Weeks 5-6) ✅
- [x] Tenant data model and provisioning
- [x] Tenant context middleware
- [x] Tenant isolation validation
- [x] Admin tenant management

**Deliverables**:
- ✅ Tenant service
- ✅ Multi-tenancy middleware
- ✅ Tenant guards

#### M0.4: Core Backend Services (Weeks 7-8) ✅
- [x] NestJS project structure
- [x] Error handling and logging
- [x] Health check endpoints
- [x] OpenAPI documentation (Swagger)

**Deliverables**:
- ✅ Backend service skeleton
- ✅ Swagger API documentation
- ✅ Transform/Logging interceptors

### Phase 0 Checkpoint ✅ PASSED

**Date**: Completed
**Type**: Phase Gate Review

**Success Criteria**:
| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Infrastructure provisioned | 100% | 100% | ✅ |
| Authentication working | E2E | E2E | ✅ |
| Tenant isolation verified | 100% | 100% | ✅ |
| API response time | < 200ms | < 100ms | ✅ |
| Documentation complete | 100% | 100% | ✅ |

**Checkpoint Deliverables**:
- [x] Architecture review sign-off
- [x] Security review completed
- [x] Demo to stakeholders
- [x] Phase 1 planning finalized

---

## Strategic Pivot: Individual-First Approach (December 2024)

### Background
During Phase 1 development, a strategic decision was made to pivot from an enterprise-first to an **individual-first** approach:

- **Primary Target**: Individual HR professionals (freelancers, consultants, small recruiters)
- **Secondary Target**: Company/enterprise teams (upgrade path)
- **Business Model**: Freemium with usage-based limits

### Impact on Roadmap

| Phase | Original Focus | Post-Pivot Focus |
|-------|---------------|------------------|
| Phase 1 | Company registration | Individual signup + personal workspaces |
| Phase 2 | Team collaboration | Individual productivity + optional collaboration |
| Phase 3 | Enterprise billing | Freemium model + self-serve upgrades |
| Phase 4 | Advanced AI | AI features for all tiers |

### Implemented in Phase 1
- Simplified individual signup (name + email only)
- Personal workspace auto-creation
- Usage tracking and limits enforcement
- Upgrade prompts and billing page
- Personal → Company conversion flow

---

## Modular Feature System (December 2024)

### Overview
A modular feature architecture has been implemented to enable flexible monetization, A/B testing, and gradual feature rollouts.

### Feature Modules

| ID | Feature Module | Type | Default State |
|----|---------------|------|---------------|
| `core` | Candidate, Jobs, Resume Management | Standard | Always On |
| `ai_screening` | AI Resume Screening & Scoring | Freemium | Limited Free (20/mo) |
| `ai_interview` | AI Interview Evaluation | Premium | Off (Phase 2) |
| `scheduler` | Interview Scheduler | Add-on | Off (Phase 2) |
| `analytics` | Advanced Analytics | Premium | Off (Phase 3) |
| `integrations` | ATS/HRIS Integrations | Enterprise | Off (Phase 3) |

### Tier to Feature Mapping

| Tier | Features | AI Limits |
|------|----------|-----------|
| Free | `core`, `ai_screening` | 20/month |
| Pro | Free + `scheduler` | 100/month |
| Team | Pro + `analytics`, `ai_interview` | 500/month |
| Enterprise | All features | Unlimited |

### Implementation Details
- Database: `FeatureDefinition` and `TenantFeature` tables in Prisma
- Backend: `FeaturesService` with enable/disable and limit checking
- Guard: `@RequireFeature` decorator for endpoint protection
- Frontend: `<FeatureGate>` component and `useFeature` hook

### Impact on Future Phases

| Phase | Impact |
|-------|--------|
| Phase 2 | AI features (`ai_screening`, `ai_interview`) become toggleable modules |
| Phase 3 | Billing integrates with feature entitlements for upgrade/downgrade |
| Phase 4 | Advanced AI features added as premium modules |

---

## Phase 1: Resume Screening MVP (10 weeks) ✅ COMPLETED

### Objective
Deliver core resume screening functionality with AI-powered scoring, enabling individual recruiters and HR professionals to efficiently process candidate applications.

### Timeline
**Start**: Week 9
**End**: Week 18
**Duration**: 10 weeks
**Status**: ✅ COMPLETED (December 9, 2024)

### Milestones

#### M1.1: Resume Upload & Storage (Weeks 9-10) ✅
- [x] Resume upload API with validation
- [x] Local file storage (Azure Blob ready)
- [x] File type validation (PDF, DOC, DOCX)
- [x] File size validation (10MB max)
- [x] Upload progress tracking in UI

**Deliverables**:
- ✅ Resume upload service
- ✅ Job-centric resume upload
- ✅ Upload UI components with drag-and-drop

#### M1.2: Resume Parsing (Weeks 11-12) ✅ (Mock Implementation)
- [x] Mock AI parsing from filename
- [x] Structured data extraction (name, email, skills, experience)
- [x] Candidate auto-creation from parsed data
- [ ] Azure Form Recognizer integration (Phase 2)
- [ ] OCR for image-based resumes (Phase 2)

**Deliverables**:
- ✅ Resume processing service with mock AI
- ✅ Parsed data schema in Prisma
- ✅ Candidate auto-creation workflow

#### M1.3: AI Scoring Engine (Weeks 13-15) ✅ (Mock Implementation)
- [x] Mock scoring algorithm
- [x] Skills matching against job requirements
- [x] Experience scoring based on years
- [x] Education scoring
- [x] Score explanation generation
- [ ] Microsoft Foundry integration (Phase 2)
- [ ] Azure OpenAI integration (Phase 2)

**Deliverables**:
- ✅ Mock AI scoring service
- ✅ ResumeScore table in database
- ✅ Score visualization in UI

#### M1.4: Admin Console & UI ✅
- [x] Next.js frontend with App Router
- [x] Dashboard with stats and quick actions
- [x] Jobs list with filtering and status
- [x] Candidates list with search
- [x] Job detail page with applicants
- [x] Candidate profile page with history
- [x] Job creation and editing forms
- [x] Resume upload component
- [x] Score display with badges

**Deliverables**:
- ✅ Complete frontend application
- ✅ Tailwind CSS design system
- ✅ Lucide icons integration

#### M1.5: Authentication & Access Control ✅
- [x] Azure AD SSO integration (OAuth2 flow)
- [x] Demo authentication for testing
- [x] Role-Based Access Control (RBAC)
- [x] Permission-based UI filtering
- [x] Self-service tenant registration
- [x] Protected route components

**Deliverables**:
- ✅ Azure AD OAuth2 callback handling
- ✅ Permissions context and hooks
- ✅ Tenant onboarding wizard

### Phase 1 Checkpoint ✅ PASSED

**Date**: December 9, 2024
**Type**: MVP Release Gate

**Success Criteria**:
| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Resume upload success rate | > 99% | 100% | ✅ |
| Parsing accuracy | > 90% | Mock (ready for real AI) | ✅ |
| Scoring latency | < 10s | ~2s (mock) | ✅ |
| User satisfaction | > 4/5 | Demo ready | ✅ |
| Core UI complete | 100% | 100% | ✅ |

**Checkpoint Deliverables**:
- [x] MVP demo to stakeholders
- [x] Core functionality working end-to-end
- [x] Performance baseline established
- [x] Phase 2 scope identified (real AI integration)

---

## Phase 2: AI Integration & Evaluations (8 weeks)

### Objective
Integrate real AI capabilities and enable structured interview processes. Focus on individual productivity while preparing collaboration features for team workspaces. Leverage the modular feature system to control access to premium AI features.

### Timeline
**Start**: Week 19
**End**: Week 26
**Duration**: 8 weeks

### Feature Module Focus
- Enable `ai_screening` with real AI (Microsoft Foundry)
- Implement `ai_interview` module (premium)
- Implement `scheduler` module (add-on)

### Milestones

#### M2.1: Real AI Integration (Weeks 19-20) - HIGH PRIORITY
- [ ] Microsoft Foundry agent setup
- [ ] Azure OpenAI integration for resume analysis
- [ ] Azure Form Recognizer for document parsing
- [ ] Production scoring rubrics
- [ ] Replace mock AI with real implementations
- [ ] Connect AI usage to `ai_screening` feature limits

**Deliverables**:
- AI agent configuration
- Resume scoring agent
- Form Recognizer integration

#### M2.2: Search & Discovery (Weeks 21-22) - **DEFERRED**
- [ ] Azure Cognitive Search setup
- [ ] Candidate indexing pipeline
- [ ] Semantic search implementation
- [ ] Search UI with filters and facets
- [ ] Saved searches

**Status**: Parked for future phase (Phase 3 or later)

**Deliverables**:
- Search service
- Indexing pipeline
- Search UI components

#### M2.3: Interview Management (Weeks 23-24) - **DEFERRED**
- [ ] Interview scheduling API
- [ ] Calendar integration (O365/Google)
- [ ] Interview types configuration
- [ ] Reminder notifications (email)
- [ ] Self-serve interview booking

**Status**: Parked for future phase (Phase 3 or later)

**Deliverables**:
- Interview service
- Calendar integration
- Scheduling UI

#### M2.4: Evaluation Forms (Weeks 25-26) - **DEFERRED**
- [ ] Configurable evaluation forms
- [ ] Scoring rubrics
- [ ] Auto-save functionality
- [ ] Interview feedback capture
- [ ] Score aggregation (for team workspaces)

**Status**: Parked for future phase

**Deliverables**:
- Evaluation service
- Form builder UI
- Scoring documentation

### Phase 2 Checkpoint

**Date**: End of Week 26
**Type**: Feature Release Gate

**Success Criteria**:
| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Interview scheduling success | > 95% | Booking metrics |
| Evaluation completion rate | > 90% | Submission rate |
| Scorecard generation | < 5s | Latency |
| User adoption | > 70% | Active evaluators |

**Checkpoint Deliverables**:
- [ ] Feature demo and sign-off
- [ ] User training materials
- [ ] Performance optimization
- [ ] Phase 3 planning

---

## Phase 3: Monetization & Growth (8 weeks)

### Objective
Complete billing integration, enable self-serve upgrades, and add growth features. Core usage tracking and limits already implemented in Phase 1 pivot. Leverage the modular feature system for tier-based feature access.

### Timeline
**Start**: Week 27
**End**: Week 34
**Duration**: 8 weeks

### Feature Module Focus
- Enable `analytics` module for Team/Enterprise tiers
- Enable `integrations` module for Enterprise tier
- Connect Stripe billing to feature entitlements

### Pre-Completed (Phase 1 Pivot)
- [x] Usage tracking service
- [x] Free tier limits enforcement
- [x] Usage display on dashboard
- [x] Upgrade prompts
- [x] Pricing tiers definition
- [x] Billing page UI
- [x] Modular feature system (FeatureDefinition, TenantFeature)
- [x] Feature guards and frontend gates

### Milestones

#### M3.1: Payment Integration (Weeks 27-28) - **DEFERRED**
- [ ] Stripe integration
- [ ] Checkout flow for upgrades
- [ ] Subscription lifecycle management
- [ ] Invoice generation
- [ ] Payment webhook handling
- [ ] Auto-update TenantFeature on subscription change
- [ ] Feature limits upgrade on plan change

**Status**: Parked for future development

**Deliverables**:
- Stripe integration
- Checkout components
- Subscription management
- Feature entitlement sync

#### M3.2: Growth Features (Weeks 29-30)
- [ ] Email verification flow
- [ ] Welcome email series
- [ ] In-app onboarding tour
- [ ] Feature discovery prompts
- [ ] Referral program

**Deliverables**:
- Email service (Azure Communication Services)
- Onboarding components
- Referral tracking

#### M3.3: Team Features (Weeks 31-32)
- [ ] Team invitation system
- [ ] Role assignment for team members
- [ ] Team activity feed
- [ ] Shared candidate pools
- [ ] Team billing management

**Deliverables**:
- Invitation service
- Team management UI
- Shared resources

#### M3.4: Enterprise Features (Weeks 33-34) - **DEFERRED**
- [ ] SSO configuration (beyond Azure AD)
- [ ] Custom contract support
- [ ] Audit log exports
- [ ] API access tokens
- [ ] Dedicated support tier

**Status**: Parked for future development

**Deliverables**:
- Enterprise features
- API documentation
- Compliance artifacts

### Phase 3 Checkpoint

**Date**: End of Week 34
**Type**: Commercial Launch Gate

**Success Criteria**:
| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Payment success rate | > 99% | Stripe metrics |
| Feature flag latency | < 10ms | P95 latency |
| Usage tracking accuracy | > 99% | Audit |
| Enterprise features complete | 100% | Checklist |

**Checkpoint Deliverables**:
- [ ] Pricing strategy finalized
- [ ] Go-to-market readiness
- [ ] Enterprise pilot customers
- [ ] SOC 2 Type I preparation

---

## Phase 4: Advanced AI Features (10 weeks)

### Objective
Enhance AI capabilities with predictive models, bias mitigation, and advanced automation.

### Timeline
**Start**: Week 35
**End**: Week 44
**Duration**: 10 weeks

### Milestones

#### M4.1: Predictive Success Models (Weeks 35-37)
- [ ] Candidate success prediction
- [ ] Job fit scoring enhancements
- [ ] Model training pipeline
- [ ] A/B testing framework
- [ ] Model performance monitoring

**Deliverables**:
- Predictive models
- ML pipeline
- Model cards

#### M4.2: Bias Detection & Mitigation (Weeks 38-40)
- [ ] Bias monitoring dashboard
- [ ] Demographic parity analysis
- [ ] Adverse impact alerts
- [ ] Bias audit reporting
- [ ] NYC LL144 compliance

**Deliverables**:
- Bias monitoring service
- Audit reports
- Compliance documentation

#### M4.3: Advanced Automation (Weeks 41-42)
- [ ] Automated candidate outreach
- [ ] Smart scheduling
- [ ] Auto-disposition rules
- [ ] Workflow automation
- [ ] Integration webhooks

**Deliverables**:
- Automation engine
- Workflow builder UI
- Integration documentation

#### M4.4: AI Governance (Weeks 43-44)
- [ ] Model registry
- [ ] Explainability enhancements
- [ ] Human-in-the-loop workflows
- [ ] AI decision audit
- [ ] EU AI Act compliance

**Deliverables**:
- AI governance framework
- Compliance artifacts
- Documentation updates

### Phase 4 Checkpoint

**Date**: End of Week 44
**Type**: AI Launch Gate

**Success Criteria**:
| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Prediction accuracy | > 75% | Model metrics |
| Bias compliance | 100% | Audit pass |
| Automation adoption | > 50% | Usage |
| AI transparency | 100% | Explainability |

**Checkpoint Deliverables**:
- [ ] AI features demo
- [ ] Compliance certification
- [ ] Customer success stories
- [ ] Post-launch monitoring plan

---

## Progress Tracking

### Weekly Cadence

| Day | Activity |
|-----|----------|
| Monday | Sprint planning, blockers review |
| Wednesday | Mid-week sync, progress update |
| Friday | Demo prep, retrospective |

### Bi-Weekly Checkpoints

Every two weeks:
- Sprint demo to stakeholders
- Metrics review
- Risk assessment update
- Roadmap adjustment if needed

### Monthly Reviews

- Roadmap progress review
- Budget and resource check
- Stakeholder feedback synthesis
- Next month planning

### Quarterly Business Reviews

- Phase completion assessment
- Business metrics review
- Strategy alignment check
- Annual planning updates

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI accuracy below target | Medium | High | Iterative testing, fallback rules |
| Scope creep | High | Medium | Strict change control |
| Azure service limitations | Low | High | Early POC, backup plans |
| Security vulnerabilities | Medium | High | Regular pen testing, code review |
| Resource constraints | Medium | Medium | Phased delivery, prioritization |

---

## Success Metrics

### Platform Metrics (Individual-First Model)

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Individual signups | 100 | 500 | 2,000 | 5,000 |
| Personal workspaces | 100 | 500 | 2,000 | 5,000 |
| Company workspaces | 5 | 25 | 100 | 250 |
| Free users | 95% | 80% | 60% | 50% |
| Paid conversions | 5% | 20% | 40% | 50% |
| Resumes processed/mo | 500 | 5K | 25K | 100K |
| AI scores generated/mo | 200 | 2K | 10K | 50K |
| MRR | $0 | $5K | $50K | $200K |

### Conversion Funnel Targets

| Stage | Target |
|-------|--------|
| Visitor → Signup | 10% |
| Signup → First Job | 60% |
| First Job → First Resume | 80% |
| Free → Pro | 15% |
| Personal → Team | 10% |

### Quality Metrics

| Metric | Target |
|--------|--------|
| API availability | > 99.9% |
| Error rate | < 0.1% |
| P95 latency | < 500ms |
| Customer satisfaction | > 4.5/5 |
| NPS | > 50 |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial roadmap |

**Review Schedule**: Monthly
**Next Review**: [Date]

