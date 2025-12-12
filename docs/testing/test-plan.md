# HireFit Beta Testing Plan

## Test Environment

- **Frontend**: https://hirefit-web-beta.icyfield-0d6da074.eastus.azurecontainerapps.io
- **API**: https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io
- **API Docs**: https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/docs

## Test Scenarios

### 1. Authentication & User Management

#### 1.1 User Registration
- [ ] Navigate to signup page
- [ ] Create new account with email/password
- [ ] Verify tenant is created
- [ ] Verify user receives welcome email (check console logs)
- [ ] Verify features are initialized (core, ai_screening)

#### 1.2 User Login
- [ ] Login with email/password
- [ ] Verify JWT token is stored
- [ ] Verify redirect to dashboard
- [ ] Verify user data is loaded

#### 1.3 Demo Login
- [ ] Click "Demo Login" button
- [ ] Verify automatic login
- [ ] Verify demo tenant access

### 2. Job Management

#### 2.1 Create Job
- [ ] Navigate to Jobs → New Job
- [ ] Fill in job details (title, description, requirements)
- [ ] Set location, employment type, salary
- [ ] Save job
- [ ] Verify job appears in jobs list
- [ ] Verify job status is "draft"

#### 2.2 Edit Job
- [ ] Open existing job
- [ ] Update job details
- [ ] Save changes
- [ ] Verify changes are reflected

#### 2.3 Publish Job
- [ ] Open draft job
- [ ] Click "Publish"
- [ ] Verify status changes to "open"
- [ ] Verify publishedAt timestamp is set

#### 2.4 Job List & Filtering
- [ ] View jobs list
- [ ] Filter by status (draft, open, closed)
- [ ] Search jobs by title
- [ ] Verify pagination works

### 3. Resume Upload & AI Scoring

#### 3.1 Upload Resume to Job
- [ ] Open a job
- [ ] Click "Upload Resume"
- [ ] Upload PDF resume
- [ ] Verify upload progress indicator
- [ ] Verify resume is queued for processing
- [ ] Wait for AI processing (check Service Bus queue)
- [ ] Verify AI scores appear (overallScore, skillsMatchScore, etc.)
- [ ] Verify explanation is generated

#### 3.2 Resume Scoring Details
- [ ] View scored resume
- [ ] Verify all score dimensions:
  - Overall Score (0-100)
  - Skills Match Score
  - Experience Match Score
  - Education Match Score
  - Overall Fit Score
- [ ] Verify confidence level
- [ ] Verify explanation text
- [ ] Verify matched/missing skills

#### 3.3 Multiple Resumes
- [ ] Upload 3-5 different resumes to same job
- [ ] Verify all are processed
- [ ] Verify scores are different
- [ ] Verify sorting by score works

### 4. Candidate Management

#### 4.1 Create Candidate
- [ ] Navigate to Candidates → New
- [ ] Fill in candidate details
- [ ] Save candidate
- [ ] Verify candidate appears in list

#### 4.2 Candidate Profile
- [ ] View candidate profile
- [ ] Verify all details are displayed
- [ ] Verify resume list
- [ ] Verify application history

#### 4.3 Apply Candidate to Job
- [ ] From candidate profile, click "Apply to Job"
- [ ] Select a job
- [ ] Submit application
- [ ] Verify application is created
- [ ] Verify application appears in job's applications list

### 5. Team Features

#### 5.1 Invite Team Member
- [ ] Navigate to Settings → Team
- [ ] Click "Invite Member"
- [ ] Enter email address
- [ ] Select role (Admin, Member, Viewer)
- [ ] Send invitation
- [ ] Verify invitation is created
- [ ] Verify invitation email is sent (check console logs)

#### 5.2 Accept Invitation
- [ ] Use invitation link from email
- [ ] Create account
- [ ] Verify user is added to tenant
- [ ] Verify role is set correctly

#### 5.3 Activity Feed
- [ ] Perform various actions (create job, upload resume, etc.)
- [ ] Navigate to Activity Feed
- [ ] Verify activities are logged
- [ ] Verify activities show correct user and action

#### 5.4 Role-Based Access
- [ ] Test with Viewer role (should have read-only access)
- [ ] Test with Member role (should be able to create/edit)
- [ ] Test with Admin role (should have full access)

### 6. Onboarding Features

#### 6.1 Onboarding Tour
- [ ] Login as new user
- [ ] Verify onboarding tour starts
- [ ] Complete tour steps
- [ ] Verify tour completion is saved

#### 6.2 Feature Discovery
- [ ] Navigate to different sections
- [ ] Verify feature prompts appear for new features
- [ ] Dismiss prompts
- [ ] Verify prompts don't reappear

### 7. Usage & Limits

#### 7.1 Usage Dashboard
- [ ] Navigate to Settings → Usage
- [ ] Verify usage stats are displayed:
  - Active Jobs
  - Total Candidates
  - AI Scores This Month
  - Team Members
- [ ] Verify limits are shown
- [ ] Verify percentage bars

#### 7.2 Limit Warnings
- [ ] Upload multiple resumes (use up AI score limit)
- [ ] Verify warning appears when approaching limit
- [ ] Verify error when limit is reached

### 8. API Testing

#### 8.1 Health Checks
- [ ] GET /health - Verify API is up
- [ ] GET /health/ai - Verify AI services status

#### 8.2 Authentication Endpoints
- [ ] POST /api/auth/register - Create account
- [ ] POST /api/auth/login - Get JWT token
- [ ] GET /api/auth/me - Get current user

#### 8.3 Jobs Endpoints
- [ ] GET /api/jobs - List jobs
- [ ] POST /api/jobs - Create job
- [ ] GET /api/jobs/:id - Get job details
- [ ] PATCH /api/jobs/:id - Update job
- [ ] POST /api/jobs/:id/publish - Publish job

#### 8.4 Resume Endpoints
- [ ] POST /api/jobs/:id/resumes - Upload resume
- [ ] GET /api/jobs/:id/resumes/status - Check processing status
- [ ] GET /api/applications - List applications

### 9. Error Handling

#### 9.1 Invalid Input
- [ ] Submit form with missing required fields
- [ ] Verify validation errors appear
- [ ] Submit invalid email format
- [ ] Verify error message

#### 9.2 Unauthorized Access
- [ ] Try to access protected route without login
- [ ] Verify redirect to login
- [ ] Try to access other tenant's data
- [ ] Verify 403 error

#### 9.3 Feature Limits
- [ ] Exceed AI score limit
- [ ] Verify error message
- [ ] Verify upgrade prompt

### 10. Performance

#### 10.1 Page Load Times
- [ ] Measure dashboard load time
- [ ] Measure jobs list load time
- [ ] Measure candidate list load time

#### 10.2 AI Processing
- [ ] Upload resume
- [ ] Measure time from upload to score completion
- [ ] Verify processing is asynchronous (doesn't block UI)

### 11. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### 12. Mobile Responsiveness

- [ ] Test on mobile viewport
- [ ] Verify navigation works
- [ ] Verify forms are usable
- [ ] Verify tables are scrollable

## Test Results Template

```
Test Date: [Date]
Tester: [Name]
Environment: Beta

### Passed Tests
- [List of passed tests]

### Failed Tests
- [List of failed tests with error details]

### Issues Found
- [List of bugs/issues]

### Performance Notes
- [Any performance observations]

### Recommendations
- [Suggestions for improvements]
```

