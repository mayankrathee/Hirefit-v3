# HireFit Platform Documentation

## Overview

Welcome to the HireFit documentation. This documentation covers all aspects of the HireFit AI-enabled talent acquisition platform, from architecture and development to operations and compliance.

---

## Current Status

| Phase | Status | Completion Date |
|-------|--------|-----------------|
| Phase 0: Foundation | ✅ Complete | Dec 8, 2024 |
| Phase 1: Resume Screening MVP | ✅ Complete | Dec 9, 2024 |
| Phase 1.5: Individual-First Pivot | ✅ Complete | Dec 9, 2024 |
| Phase 1.6: Modular Feature System | ✅ Complete | Dec 9, 2024 |
| Phase 2: AI Integration (M2.1) | ✅ Complete | Dec 11, 2024 |
| Phase 2: Search & Interview (M2.2-2.4) | 🚧 Deferred | - |
| Phase 3: Growth Features (M3.2) | ✅ Complete | Dec 12, 2024 |
| Phase 3: Team Features (M3.3) | ✅ Complete | Dec 12, 2024 |
| Phase 3: Payments & Enterprise (M3.1, M3.4) | 🚧 Deferred | - |
| Phase 4: Advanced AI | 📋 Backlog | - |

**🚀 Platform Status: Ready for Beta Testing**

### Strategic Pivot: Individual-First Approach
HireFit now prioritizes **individual HR professionals** as the primary user base, with team/enterprise workspaces as an upgrade path. This enables:
- **Simplified Onboarding**: Name + email signup, instant personal workspace
- **Freemium Model**: Free tier (3 jobs, 50 candidates, 20 AI scores/month)
- **Natural Upgrade Path**: Personal → Company workspace conversion

### Modular Feature System
A flexible feature architecture enabling monetization, A/B testing, and gradual rollouts:
- **6 Feature Modules**: `core`, `ai_screening`, `ai_interview`, `scheduler`, `analytics`, `integrations`
- **4 Subscription Tiers**: Free, Pro, Team, Enterprise
- **Backend Guards**: `@RequireFeature` decorator for endpoint protection
- **Frontend Gates**: `<FeatureGate>` component and `useFeature` hooks

### Recent Highlights
- ✅ **Real AI Integration** - Azure OpenAI (GPT-4o-mini) for resume analysis
- ✅ **Document Intelligence** - Parse PDFs and Word documents
- ✅ **Async Processing** - Azure Service Bus for reliable processing
- ✅ **Email Service** - Verification, welcome, invitation emails
- ✅ **Team Invitations** - Invite members via email
- ✅ **Activity Feed** - See team actions in real-time
- ✅ **Onboarding Tour** - Guided first-time user experience
- ✅ **Feature Discovery** - Contextual feature prompts

### Phase 1 Highlights
- ✅ Job-centric resume upload with AI evaluation
- ✅ Azure AD SSO integration (OAuth2 flow)
- ✅ Role-Based Access Control (7 roles, 30+ permissions)
- ✅ Individual signup with personal workspaces
- ✅ Usage tracking and limit enforcement
- ✅ Upgrade prompts and billing page
- ✅ Full dashboard UI (Jobs, Candidates, Applications)
- ✅ Modular feature system with tier-based access

See [Progress Summary](project/PROGRESS.md) for full project status.  
See [Deployment Guide](deployment/deployment-guide.md) for setup instructions.  
See [Training Materials](training/) for user guides.

---

## Documentation Structure

```
docs/
├── README.md                      # This file - documentation home
├── CONTRIBUTING.md                # How to contribute to docs
├── CHANGELOG.md                   # Documentation changelog
│
├── architecture/                  # System architecture
│   ├── overview.md               # High-level architecture
│   ├── stack-decisions.md        # Technology decisions (ADRs)
│   ├── storage-design.md         # Azure Blob Storage design
│   ├── data-model.md             # Database schema and models
│   └── integration-patterns.md   # Integration architecture
│
├── requirements/                  # Product requirements
│   ├── personas.md               # User personas
│   ├── compliance-goals.md       # Compliance requirements
│   └── ai-constraints.md         # AI ethical guidelines
│
├── modules/                       # Feature specifications
│   ├── resume-intelligence-spec.md
│   ├── candidate-evaluation-spec.md
│   ├── monetization-spec.md
│   └── [future modules]
│
├── api/                          # API documentation
│   ├── overview.md               # API introduction
│   ├── authentication.md         # Auth guide
│   ├── endpoints/                # Endpoint references
│   └── openapi/                  # OpenAPI specifications
│
├── security/                     # Security documentation
│   ├── security-plan.md          # Comprehensive security plan
│   ├── incident-response.md      # Incident procedures
│   └── compliance/               # Compliance artifacts
│
├── deployment/                   # Deployment guides
│   ├── azure-setup.md            # Azure infrastructure
│   ├── ci-cd-pipeline.md         # CI/CD configuration
│   ├── environments.md           # Environment configuration
│   └── runbooks/                 # Operational runbooks
│
├── development/                  # Developer guides
│   ├── getting-started.md        # Quick start guide
│   ├── coding-standards.md       # Code style guide
│   ├── testing-guide.md          # Testing practices
│   └── local-setup.md            # Local environment setup
│
├── operations/                   # Operations documentation
│   ├── monitoring.md             # Monitoring guide
│   ├── troubleshooting.md        # Troubleshooting guide
│   └── backup-recovery.md        # DR procedures
│
├── templates/                    # Document templates
│   ├── adr-template.md           # Architecture Decision Record
│   ├── feature-spec-template.md  # Feature specification
│   ├── runbook-template.md       # Operational runbook
│   └── incident-report.md        # Incident report
│
└── project/                      # Project management
    ├── roadmap.md                # Product roadmap
    ├── release-notes/            # Release notes
    └── checkpoints/              # Progress checkpoints
```

---

## Quick Links

### For Developers
- [Getting Started](development/getting-started.md)
- [Local Setup](development/local-setup.md)
- [Coding Standards](development/coding-standards.md)
- [API Reference](api/overview.md)
- [AI Development Prompts](PROMPTS.md) - Key prompts for AI-assisted development

### For Architects
- [Architecture Overview](architecture/overview.md)
- [Stack Decisions](architecture/stack-decisions.md)
- [Security Plan](security/security-plan.md)

### For Operations
- [Deployment Guide](deployment/azure-setup.md)
- [Monitoring](operations/monitoring.md)
- [Runbooks](deployment/runbooks/)

### For Product
- [User Personas](requirements/personas.md)
- [Feature Specs](modules/)
- [Roadmap](project/roadmap.md)
- [Progress Summary](project/PROGRESS.md) - Current project status

---

## Documentation Standards

### Writing Guidelines

1. **Be Concise**: Get to the point quickly
2. **Use Examples**: Show, don't just tell
3. **Keep Updated**: Update docs with code changes
4. **Cross-Reference**: Link related documents
5. **Version**: Note which version docs apply to

### Formatting

- Use Markdown for all documentation
- Use code blocks with language hints
- Include diagrams (ASCII or Mermaid)
- Use tables for structured data
- Add a table of contents for long documents

### Templates

Use provided templates for consistency:
- [ADR Template](templates/adr-template.md) - For architecture decisions
- [Feature Spec Template](templates/feature-spec-template.md) - For feature specs
- [Runbook Template](templates/runbook-template.md) - For operational procedures

---

## Contributing to Documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- How to propose changes
- Review process
- Style guide
- Tools and setup

---

## Document Control

| Property | Value |
|----------|-------|
| Owner | HireFit Platform Team |
| Review Cycle | Quarterly |
| Last Review | December 9, 2024 |
| Classification | Internal |

