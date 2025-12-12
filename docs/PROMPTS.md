# HireFit Platform - Key Prompts for AI Development

This document contains well-articulated prompts for starting new development sessions with AI assistants. These prompts are designed to provide comprehensive context while being efficient with token usage.

**Last Updated**: December 9, 2024

---

## Table of Contents

1. [Phase 2: AI Integration & Evaluations](#phase-2-ai-integration--evaluations)
2. [Phase 3: Monetization & Growth](#phase-3-monetization--growth)
3. [Phase 4: Advanced AI Features](#phase-4-advanced-ai-features)
4. [General Development Session](#general-development-session)
5. [Quick Reference Prompts](#quick-reference-prompts)

---

## Phase 2: AI Integration & Evaluations

### Full Context Prompt

```
# HireFit Platform - Phase 2: AI Integration & Evaluations

## Project Context

I'm continuing development on HireFit, an AI-enabled talent acquisition platform for HR professionals. 
Phase 1 is complete with:
- Individual-first onboarding (personal workspaces, freemium model)
- Job-centric resume upload with mock AI evaluation
- Modular feature system (6 features, 4 subscription tiers)
- Role-based access control with Azure AD SSO
- Usage tracking and limit enforcement

## Key Documentation (Please Review)

1. **Progress Summary**: `docs/project/PROGRESS.md`
   - Complete project status, technical stack, API endpoints, next steps

2. **Phase 2 Roadmap**: `docs/project/roadmap.md`
   - Phase 2 milestones, priorities, success criteria

3. **Architecture**: `docs/architecture/overview.md`
   - System architecture, feature system design (Section 5)

4. **Phase 1 Checkpoint**: `docs/project/checkpoints/phase-1-completion.md`
   - What's built, technical deliverables, known limitations

5. **Monetization Spec**: `docs/modules/monetization-spec.md`
   - Feature pricing strategy, implementation status

## Key Implementation Files

**Mock AI to Replace**:
- `apps/api/src/modules/resumes/resume-processing.service.ts` - Current mock AI logic

**Feature System (for gating AI features)**:
- `apps/api/src/modules/features/features.service.ts` - Feature management
- `apps/api/src/common/guards/feature.guard.ts` - @RequireFeature decorator
- `apps/web/src/hooks/use-feature.tsx` - Frontend feature hooks
- `apps/web/src/components/features/feature-gate.tsx` - FeatureGate component

**Database Schema**:
- `apps/api/prisma/schema.prisma` - Full data model with features

## Phase 2 Priorities

1. **P0 - Real AI Integration** (Weeks 1-2)
   - Microsoft Foundry agent setup
   - Azure OpenAI for resume analysis
   - Azure Form Recognizer for document parsing
   - Connect AI usage to `ai_screening` feature limits

2. **P1 - Search & Discovery** (Weeks 3-4)
   - Azure Cognitive Search setup
   - Candidate indexing pipeline
   - Semantic search UI

3. **P2 - Interview Management** (Weeks 5-6)
   - Interview scheduling API (`scheduler` feature module)
   - Calendar integration (O365/Google)

4. **P3 - Evaluation Forms** (Weeks 7-8)
   - AI-assisted evaluation (`ai_interview` feature module)
   - Scoring rubrics

## Current Technical Stack

- Frontend: Next.js 14, React, Tailwind CSS
- Backend: NestJS, TypeScript, Prisma
- Database: SQLite (dev), Azure SQL (prod ready)
- Auth: JWT + Azure AD OAuth2

## First Task

Let's start with Priority 0: Replace the mock AI in `resume-processing.service.ts` with 
Microsoft Foundry/Azure OpenAI integration. Please:

1. Review the current mock implementation
2. Propose the architecture for real AI integration
3. Create a plan for the implementation

I want to use the existing feature system to gate and track AI usage.
```

### Short Version (Token-Efficient)

```
# HireFit - Phase 2: AI Integration

Phase 1 complete. Key docs:
- docs/project/PROGRESS.md (full status)
- docs/project/roadmap.md (Phase 2 plan)

Key files:
- apps/api/src/modules/resumes/resume-processing.service.ts (mock AI to replace)
- apps/api/src/modules/features/ (feature gating system)

Goal: Replace mock AI with Microsoft Foundry/Azure OpenAI. Start with Priority 0.
```

---

## Phase 3: Monetization & Growth

### Full Context Prompt

```
# HireFit Platform - Phase 3: Monetization & Growth

## Project Context

HireFit is an AI-enabled talent acquisition platform. Phases 0-2 are complete:
- Phase 0: Foundation (multi-tenancy, auth)
- Phase 1: Resume screening MVP with individual-first pivot
- Phase 2: Real AI integration, search, interview management

## Key Documentation

1. **Progress Summary**: `docs/project/PROGRESS.md`
2. **Roadmap**: `docs/project/roadmap.md` (Phase 3 section)
3. **Monetization Spec**: `docs/modules/monetization-spec.md`
4. **Feature System**: `docs/architecture/overview.md` (Section 5)

## Pre-Completed (Phase 1)

- ✅ Usage tracking service
- ✅ Free tier limits enforcement
- ✅ Pricing tiers definition
- ✅ Modular feature system
- ✅ Billing page UI

## Phase 3 Priorities

1. **P0 - Payment Integration** (Weeks 1-2)
   - Stripe integration
   - Checkout flow for upgrades
   - Auto-update TenantFeature on subscription change
   - Payment webhook handling

2. **P1 - Growth Features** (Weeks 3-4)
   - Email verification flow
   - Welcome email series
   - In-app onboarding tour

3. **P2 - Team Features** (Weeks 5-6)
   - Team invitation system
   - Role assignment
   - Shared candidate pools

4. **P3 - Enterprise Features** (Weeks 7-8)
   - Advanced analytics (`analytics` feature module)
   - ATS/HRIS integrations (`integrations` feature module)
   - API access tokens

## Key Files

**Feature System**:
- `apps/api/src/modules/features/features.service.ts`
- `apps/api/src/modules/tenants/tenants.service.ts` (has upgradeTenantFeatures)

**Usage Tracking**:
- `apps/api/src/modules/usage/usage.service.ts`

**Frontend Billing**:
- `apps/web/src/app/(dashboard)/dashboard/settings/billing/page.tsx`

## First Task

Let's start with Priority 0: Stripe integration. Please:
1. Review the existing usage/feature system
2. Design Stripe integration architecture
3. Plan subscription lifecycle management
4. Connect billing to feature entitlements
```

---

## Phase 4: Advanced AI Features

### Full Context Prompt

```
# HireFit Platform - Phase 4: Advanced AI Features

## Project Context

HireFit platform with Phases 0-3 complete:
- Foundation, MVP, AI integration, monetization all done
- Real AI resume screening operational
- Payment processing active
- Team collaboration enabled

## Key Documentation

1. **Progress Summary**: `docs/project/PROGRESS.md`
2. **Roadmap**: `docs/project/roadmap.md` (Phase 4 section)
3. **AI Constraints**: `docs/requirements/ai-constraints.md`
4. **Compliance Goals**: `docs/requirements/compliance-goals.md`

## Phase 4 Priorities

1. **Predictive Success Models** (Weeks 1-3)
   - Candidate success prediction
   - Model training pipeline
   - A/B testing framework

2. **Bias Detection & Mitigation** (Weeks 4-6)
   - Bias monitoring dashboard
   - Demographic parity analysis
   - NYC LL144 compliance

3. **Advanced Automation** (Weeks 7-8)
   - Automated candidate outreach
   - Smart scheduling
   - Workflow automation

4. **AI Governance** (Weeks 9-10)
   - Model registry
   - Explainability enhancements
   - EU AI Act compliance

## Key Files

**AI Services**:
- `apps/api/src/modules/resumes/resume-processing.service.ts`
- Microsoft Foundry agents (Phase 2)

**Feature System**:
- `apps/api/src/modules/features/` (for gating AI features)

## First Task

Let's start with predictive models. Please:
1. Review existing AI implementation
2. Design ML pipeline architecture
3. Plan model training and deployment
4. Address bias and fairness requirements
```

---

## General Development Session

### Prompt for Ongoing Work

```
# HireFit Platform - Development Session

## Context

Working on HireFit, an AI-enabled talent acquisition platform.

**Current Status**: [Specify current phase/milestone]

**Key Documentation**:
- `docs/project/PROGRESS.md` - Full project status
- `docs/project/roadmap.md` - Roadmap and milestones
- `docs/architecture/overview.md` - System architecture

**Current Focus**: [Describe what you're working on]

**Files of Interest**:
- [List relevant files]

## Task

[Describe the specific task or feature you want to work on]

Please:
1. Review relevant documentation
2. Understand current implementation
3. Propose solution/plan
4. Implement if ready
```

---

## Quick Reference Prompts

### For Bug Fixes

```
# HireFit - Bug Fix

**Issue**: [Brief description]
**Location**: [File/component]
**Expected**: [What should happen]
**Actual**: [What's happening]

Key context:
- docs/project/PROGRESS.md (project status)
- [Relevant file paths]

Please investigate and fix.
```

### For Feature Additions

```
# HireFit - New Feature

**Feature**: [Name]
**Phase**: [Phase number]
**Priority**: [P0/P1/P2]

**Requirements**:
- [Requirement 1]
- [Requirement 2]

**Related Files**:
- [Existing files to modify/extend]

**Documentation**:
- docs/project/PROGRESS.md
- docs/project/roadmap.md

Please design and implement.
```

### For Code Review

```
# HireFit - Code Review

**Files to Review**:
- [File paths]

**Context**:
- docs/project/PROGRESS.md
- [Related documentation]

**Focus Areas**:
- [Specific concerns or areas]

Please review for:
- Code quality
- Architecture alignment
- Best practices
- Potential issues
```

### For Documentation Updates

```
# HireFit - Documentation Update

**What Changed**: [Brief description of code/feature changes]

**Files Modified**:
- [Code files]

**Documentation to Update**:
- docs/project/PROGRESS.md
- docs/CHANGELOG.md
- [Other relevant docs]

Please update documentation to reflect changes.
```

---

## Prompt Best Practices

### Do's ✅

1. **Reference Key Docs**: Always mention `docs/project/PROGRESS.md` for full context
2. **Be Specific**: Include file paths and specific tasks
3. **Set Priorities**: Use P0/P1/P2 notation for clarity
4. **Provide Context**: Brief summary of what's already built
5. **State Goals**: Clear objective for the session

### Don'ts ❌

1. **Don't Overload**: Avoid listing 20+ files in one prompt
2. **Don't Skip Context**: AI needs to know what's already done
3. **Don't Be Vague**: "Make it better" is not actionable
4. **Don't Forget Constraints**: Mention technical constraints if relevant

---

## Updating This Document

When adding new prompts:

1. **Add to appropriate section** (Phase-specific or General)
2. **Include both full and short versions** if applicable
3. **Update "Last Updated" date** at top
4. **Reference in PROGRESS.md** if it's a major phase prompt

---

## Document Control

| Property | Value |
|----------|-------|
| Owner | HireFit Platform Team |
| Last Updated | December 9, 2024 |
| Review Cycle | After each phase completion |
| Next Review | After Phase 2 completion |



