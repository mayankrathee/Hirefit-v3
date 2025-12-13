# Documentation Changelog

All notable changes to the HireFit documentation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Phase 4 planning documents (pending)

### Changed
- N/A

---

## [2.1.0] - 2025-01-XX 🔐 Authentication Security Update

### Added - Enhanced Authentication System

#### Email/Password Authentication
- **Password-based signup** with bcrypt hashing (10 rounds)
- **Email verification required** before login
- **Verification email** sent automatically on signup
- **Verification token** expires in 24 hours
- **Password validation** (minimum 8 characters)
- **Login endpoint** (`POST /api/auth/login`) with email verification check

#### Google OAuth Integration
- **Google OAuth login** (`GET /api/auth/google/login`)
- **Google OAuth callback** (`GET /api/auth/google/callback`)
- **Auto-account creation** for new Google users
- **Auto-email verification** (Google verifies emails)
- **Account linking** for existing users

#### Enhanced Microsoft OAuth
- **Auto-email verification** for Microsoft OAuth users
- **Improved error handling** for OAuth failures

#### Security Improvements
- **Email verification required** for email/password accounts
- **OAuth accounts auto-verified** (Google/Microsoft verify emails)
- **Password hashing** with bcrypt
- **Token-based email verification** with expiration
- **Welcome email** sent after verification

### Changed - Authentication Flow

#### Removed
- **Demo login feature** removed (was development-only)
- **Auto-login after signup** removed (requires email verification)

#### Updated
- **Signup flow** now includes password field
- **Signup success page** shows email verification instructions
- **Login page** includes email/password form
- **Login page** shows Google and Microsoft OAuth buttons
- **Auth provider** updated with new login methods

### API Endpoints

#### New Endpoints
```
POST /api/auth/login              # Email/password login
GET  /api/auth/google/login       # Initiate Google OAuth
GET  /api/auth/google/callback    # Google OAuth callback
```

#### Updated Endpoints
```
POST /api/tenants/signup          # Now requires password field
GET  /api/auth/azure-ad/callback  # Now auto-verifies email
```

### Database Schema Changes

#### User Model
- `passwordHash` field already exists (now used)
- `emailVerified` field already exists (now enforced)
- `emailVerificationToken` field already exists (now used)
- `emailVerificationExpires` field already exists (now used)

### Frontend Changes

#### Login Page (`apps/web/src/app/(auth)/login/page.tsx`)
- Added email/password login form
- Added Google OAuth button
- Updated Microsoft OAuth button
- Removed demo login button
- Added password visibility toggle

#### Signup Page (`apps/web/src/app/(auth)/signup/page.tsx`)
- Added password field with validation
- Added password visibility toggle
- Updated success page with email verification message
- Removed auto-login functionality

#### Auth Provider (`apps/web/src/lib/auth/auth-provider.tsx`)
- Updated `login` method to accept email and password
- Added `loginWithGoogle` method
- Added `loginWithMicrosoft` method
- Removed `demoLogin` method

### Documentation Updates

#### Updated Files
- `docs/user-guides/LOGIN-PROCESS.md` - Complete rewrite with new authentication methods
- `docs/user-guides/SIGNUP-FIX.md` - Updated with email verification flow
- `docs/training/beta-tester-guide.md` - Updated login instructions
- `docs/training/user-guide.md` - Updated login instructions
- `docs/training/quick-reference-card.md` - Updated login options
- `docs/setup/env-configuration.md` - Added Google OAuth environment variables

### Environment Variables

#### New Variables
```env
# Google OAuth (Optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

#### Updated Variables
```env
# JWT Configuration
JWT_EXPIRES_IN=1h              # Access token (was 7d)
JWT_REFRESH_EXPIRES_IN=7d      # Refresh token (new)
```

### Migration Guide

#### For Existing Users
- Existing accounts may need to verify email on next login
- Users can use OAuth (Google/Microsoft) to skip verification
- Password reset feature coming soon

#### For Administrators
- Configure Google OAuth credentials (optional)
- Ensure email service is properly configured
- Monitor email delivery rates
- Check spam filter settings

### Breaking Changes
- **Demo login removed** - No longer available
- **Email verification required** - Users must verify email before login
- **Password required** - Signup now requires password
- **Auto-login removed** - Users must verify email and login manually

---

## [2.0.0-beta] - 2024-12-12 🚀 Beta Release

### Added - Real AI Integration (Phase 2 M2.1)

#### Azure AI Services
- Azure OpenAI integration (GPT-4o-mini) for resume analysis
- Azure Document Intelligence for PDF/DOC parsing
- Azure Service Bus for async processing
- Provider pattern for mock/foundry switching

#### AI Module (`apps/api/src/modules/ai/`)
- `AIModule` with provider factory pattern
- `FoundryAIProvider` - Real Azure AI implementation
- `MockAIProvider` - Development/testing implementation
- `ResumeScoringAgentService` - Orchestrates scoring workflow
- `DocumentParserService` - Document text extraction
- `QueuePublisherService` - Service Bus message publishing
- `QueueProcessorService` - Async resume processing

### Added - Growth Features (Phase 3 M3.2)

#### Email Module (`apps/api/src/modules/email/`)
- `EmailModule` with provider factory
- `ConsoleEmailProvider` - Development (logs to console)
- `AzureEmailProvider` - Production (Azure Communication Services)
- Email templates: verification, welcome, invitation, password reset

#### Onboarding Module (`apps/api/src/modules/onboarding/`)
- `OnboardingService` - Track user onboarding progress
- 5-step onboarding flow: welcome → profile → first_job → first_candidate → complete
- Feature discovery prompts (AI scoring, bulk upload, team collaboration)
- Email verification flow with tokens

#### Frontend Components
- `OnboardingTour` - Interactive modal tour
- `FeaturePrompt` - Contextual feature discovery
- `useOnboarding` hook - Onboarding state management

### Added - Team Features (Phase 3 M3.3)

#### Teams Module (`apps/api/src/modules/teams/`)
- `TeamsService` - Team member and invitation management
- `TeamsController` - Team management endpoints
- `InvitationController` - Public invitation acceptance
- `ActivityService` - Team activity tracking
- `ActivityController` - Activity feed endpoints

#### New API Endpoints
- `GET/POST /api/teams/members` - Team member management
- `PATCH /api/teams/members/:id/role` - Role updates
- `GET/POST/DELETE /api/teams/invitations` - Invitation management
- `GET/POST /api/invitations/:token` - Public invitation acceptance
- `GET /api/activity` - Team activity feed
- `GET/PATCH/POST /api/onboarding/*` - Onboarding progress

### Added - Documentation

#### Training Materials (`docs/training/`)
- `user-guide.md` - Complete user guide
- `beta-tester-guide.md` - Guide for beta testers
- `HireFit-Training-Deck.md` - Training presentation
- `quick-reference-card.md` - Quick reference card

#### Deployment (`docs/deployment/`)
- `deployment-guide.md` - Comprehensive deployment guide

#### Progress Reports
- `phase-2-ai-integration-progress.md` - Phase 2 M2.1 completion
- `phase-3-growth-teams-progress.md` - Phase 3 M3.2/M3.3 completion

### Changed - Database Schema
- Added to `User` model: `emailVerified`, `emailVerifiedAt`, `emailVerificationToken`, `onboardingStep`, `onboardingComplete`, `featureDiscovery`
- Added to `TenantInvitation` model: `invitedById`, `personalMessage`, `status`, `acceptedUserId`, `resendCount`

### Deferred
- M2.2: Search & Discovery (Azure AI Search)
- M2.3: Interview Management
- M2.4: Evaluation Forms
- M3.1: Payment Integration (Stripe)
- M3.4: Enterprise Features (SSO, API tokens)

---

## [1.3.0] - 2024-12-09

### Added - Modular Feature System

#### Database Schema
- `FeatureDefinition` table for system-wide feature configuration
- `TenantFeature` table for tenant-specific feature state and usage
- Feature categories: `core`, `ai`, `scheduling`, `analytics`, `integrations`
- Feature types: `standard`, `freemium`, `premium`, `addon`, `enterprise`

#### Backend Implementation
- `FeaturesModule` with global provider for feature checking
- `FeaturesService` with comprehensive feature management:
  - `isFeatureEnabled(tenantId, featureId)` - Check if feature active
  - `canUseFeature(tenantId, featureId)` - Check enabled AND within limits
  - `checkFeatureLimit(tenantId, featureId)` - Throws if limit exceeded
  - `incrementUsage(tenantId, featureId)` - Track feature usage
  - `getEnabledFeatures(tenantId)` - List active features
  - `initializeTenantFeatures(tenantId, tier)` - Set up features for new tenant
  - `upgradeTenantFeatures(tenantId, newTier)` - Handle tier changes
- `FeaturesController` with REST API endpoints
- `@RequireFeature` decorator for endpoint protection
- `FeatureGuard` for automatic feature access checking

#### Feature Definitions
| ID | Name | Type | Default Limit |
|----|------|------|---------------|
| `core` | Core Platform | Standard | Unlimited |
| `ai_screening` | AI Resume Screening | Freemium | 20/month |
| `ai_interview` | AI Interview Evaluation | Premium | 10/month |
| `scheduler` | Interview Scheduler | Add-on | Unlimited |
| `analytics` | Advanced Analytics | Premium | Unlimited |
| `integrations` | ATS/HRIS Integrations | Enterprise | Unlimited |

#### Tier to Feature Mapping
- **Free**: `core`, `ai_screening` (20/mo)
- **Pro**: Free + `scheduler` (ai_screening: 100/mo)
- **Team**: Pro + `analytics`, `ai_interview` (ai_screening: 500/mo, ai_interview: 50/mo)
- **Enterprise**: All features, unlimited

#### Frontend Implementation
- `featuresApi` client for feature API calls
- `useFeatures()` hook for feature context access
- `useFeature(featureId)` hook for single feature status
- `useCanUseFeature(featureId)` hook for conditional rendering
- `useFeatureUsage(featureId)` hook for usage statistics
- `<FeatureGate>` component for conditional content rendering
- `<FeatureUsageBar>` component for displaying usage limits
- `<FeatureBadge>` component for feature status indicators
- `withFeatureGate()` HOC for wrapping components

#### Seed Data
- Automatic seeding of feature definitions on database setup
- Initial tenant feature initialization based on subscription tier

### Changed
- Updated `TenantsService` to initialize features on registration
- Updated `TenantsService.convertToCompany` to upgrade features
- Architecture overview updated with feature system section (Section 5)
- Roadmap updated with feature module references for Phase 2/3
- Monetization spec updated with implementation status

### API Endpoints
```
GET  /api/features/definitions          # All feature definitions (public)
GET  /api/features/definitions/:id      # Single feature definition (public)
GET  /api/features/tiers                # All tier configurations (public)
GET  /api/features/tiers/:tier          # Single tier configuration (public)
GET  /api/features/tenant               # All features for current tenant
GET  /api/features/tenant/enabled       # Enabled features only
GET  /api/features/tenant/:featureId    # Single feature status
GET  /api/features/tenant/:featureId/can-use  # Check if can use
POST /api/features/tenant/:featureId/enable   # Enable (admin)
POST /api/features/tenant/:featureId/disable  # Disable (admin)
POST /api/features/tenant/:featureId/limit    # Set custom limit (admin)
```

---

## [1.2.0] - 2024-12-09

### Added - Individual-First Platform Pivot

#### Strategic Changes
- **Primary User Focus**: Individual HR professionals as core users
- **Secondary Market**: Company/enterprise accounts as upgrade path
- **Freemium Model**: Usage-based limits with upgrade prompts

#### Individual Signup Flow
- Simplified signup: Name + Email only (no company required)
- Auto-created personal workspace with free tier limits
- `POST /api/tenants/signup` endpoint for individual registration
- Success screen showing free tier benefits

#### Usage Tracking & Limits
- New `UsageModule` with comprehensive tracking service
- Free tier limits: 3 jobs, 50 candidates, 20 AI scores/month
- Real-time usage bars on dashboard
- Soft warnings at 80% usage
- Hard limits with upgrade prompts
- Monthly AI score reset mechanism

#### Workspace Conversion
- `POST /api/tenants/current/convert-to-company` endpoint
- Convert personal workspace to team account
- Preserves all existing data
- Upgrades to team tier limits

#### Billing & Plans Page
- `/dashboard/settings/billing` - Usage overview and plan management
- Current plan display with usage stats
- Pricing tier comparison
- Convert to company call-to-action

### Changed
- Updated Prisma schema: Added `type`, `ownerId`, usage limit fields to Tenant
- Tenant types: `personal` (individual) vs `company` (team/enterprise)
- Default subscription tier changed from `starter` to `free`
- Dashboard layout now includes usage display component
- Login page CTA changed from "Request access" to "Sign up free"

### Database Schema Changes
```prisma
model Tenant {
  type                  String   @default("personal")  // personal | company
  ownerId               String?
  maxJobs               Int      @default(3)
  maxCandidates         Int      @default(50)
  maxAiScoresPerMonth   Int      @default(20)
  maxTeamMembers        Int      @default(1)
  aiScoresUsedThisMonth Int      @default(0)
  usageResetDate        DateTime @default(now())
}
```

---

## [1.1.0] - 2024-12-09

### Added - Phase 1 Completion

#### Phase 1A: Core UI & Demo Authentication
- Demo authentication system with auto-provisioned test tenant/user
- Dashboard home page with stats cards and recent activity
- Jobs list UI with filtering, search, and status management
- Candidates list UI with search and filters
- Job creation and editing forms
- Candidate detail pages

#### Phase 1B: Resume Upload & Application Flow
- Job detail page with applicants view
- Candidate profile page with resume history
- Resume upload with local file storage (Azure Blob ready)
- **Job-centric resume upload with AI evaluation**
  - `POST /api/jobs/:jobId/resumes` endpoint
  - Mock AI resume parsing and scoring
  - Auto-candidate creation from parsed resume data
  - Application auto-creation linking candidate to job
  - Real-time processing status with polling
- Application flow linking candidates to jobs
- Resume processing service with mock AI scoring

#### Phase 1C: Authentication & Access Control
- **Azure AD SSO Integration**
  - OAuth2 authorization code flow
  - Token exchange and session management
  - Frontend callback handling
  - Microsoft-branded sign-in button
- **Role-Based Access Control (RBAC) UI**
  - 7 roles: System Admin, Tenant Admin, HR Admin, Recruiter, Hiring Manager, Interviewer, Viewer
  - 30+ granular permissions
  - CanAccess and RequireRole components
  - Permission-based navigation filtering
  - Role badges in header
- **Tenant Onboarding Flow**
  - Self-service registration API
  - Slug availability checking
  - Two-step signup wizard (Company → Admin)
  - Auto-provisioned tenant admin user

### Changed
- Updated Prisma schema for job-based resume uploads
- Enhanced API client with proper response parsing
- Improved sidebar with permission-based navigation
- Updated header with role badges and display names

### Security
- JWT token validation and refresh
- Tenant isolation in all API endpoints
- Role-based endpoint protection

---

## [1.0.0] - 2024-12-08

### Added
- Initial documentation release
- Complete platform documentation for Phase 0
- Monorepo structure with Turborepo
- NestJS backend with modular architecture
- Next.js frontend with App Router
- Prisma ORM with SQLite (dev) / Azure SQL (prod)
- Multi-tenant data model
- Base authentication infrastructure

---

## Template

When updating this changelog, use this template:

```markdown
## [Version] - YYYY-MM-DD

### Added
- New features or documents

### Changed
- Changes to existing documentation

### Deprecated
- Features/docs marked for removal

### Removed
- Removed features/docs

### Fixed
- Bug fixes in documentation

### Security
- Security-related changes
```

