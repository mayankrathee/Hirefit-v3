# HireFit Beta Tester Guide

**Welcome, Beta Tester!** 🎉

Thank you for helping us test HireFit. This guide will help you get the most out of your testing experience.

---

## What is HireFit?

HireFit is an **AI-powered talent acquisition platform** designed for HR professionals. It helps you:

- ✅ Post job openings
- ✅ Upload and manage resumes
- ✅ Get AI-powered candidate scoring
- ✅ Collaborate with your team
- ✅ Track your hiring pipeline

---

## Getting Access

### Login URL
```
https://[platform-url]/login
```

### Test Account Options

**Option 1: Email/Password Signup** (Recommended)
- Click "Sign up" link
- Enter name, email, and password
- Verify email (check inbox)
- Login with email/password
- Creates your own workspace
- Data persists between sessions

**Option 2: Google OAuth** (Quickest)
- Click "Sign in with Google"
- Authenticate with Google account
- Account auto-created and verified
- Immediately logged in

**Option 3: Microsoft OAuth** (If configured)
- Click "Sign in with Microsoft"
- Authenticate with Microsoft account
- Account created if enabled
- Immediately logged in

---

## What to Test

### Priority 1: Core Flow

Please test this complete flow:

1. **Sign Up** → Create account with email/password → Verify email
2. **Login** → Login with email/password (or use OAuth)
3. **Create Job** → Jobs → New Job → Fill details → Save
4. **Upload Resume** → Select job → Upload Resumes → Upload a PDF
5. **Review Score** → Wait for AI processing → Check candidate score
6. **View Candidate** → Go to Candidates → See AI-created profile

### Priority 2: Team Features

If testing with others:

1. **Invite Team Member** → Settings → Team → Invite
2. **Accept Invitation** → Check email, click link, join team
3. **See Shared Data** → Both should see same jobs/candidates
4. **Activity Feed** → Check what actions appear

### Priority 3: Edge Cases

Try these scenarios:

- Upload multiple resumes at once
- Upload a resume that's not in English
- Upload a very long resume (10+ pages)
- Try to exceed usage limits
- Test on mobile device

---

## What to Report

### Bug Reports

When you find a bug, please include:

1. **What you were doing** (steps to reproduce)
2. **What you expected to happen**
3. **What actually happened**
4. **Screenshot** (if applicable)
5. **Browser and device** (Chrome/Windows, Safari/iPhone, etc.)

### Feature Feedback

For feature suggestions:

1. **What problem are you trying to solve?**
2. **What would help you solve it?**
3. **How important is this to you?** (1-5)

### UX Feedback

For usability issues:

1. **What was confusing?**
2. **Where did you get stuck?**
3. **What would make it clearer?**

---

## Known Limitations

Please don't report these - we know about them:

| Limitation | Status |
|------------|--------|
| Email verification required for email/password accounts | ✅ Implemented |
| OAuth accounts auto-verified | ✅ Working |
| No password reset yet | Coming soon |
| Limited to English resumes | Planned enhancement |
| No mobile app | Web-only for now |

---

## Testing Checklist

### Basic Tests
- [ ] Can sign up with email/password
- [ ] Can verify email
- [ ] Can log in with email/password
- [ ] Can log in with Google OAuth
- [ ] Can log in with Microsoft OAuth (if available)
- [ ] Can see dashboard
- [ ] Can navigate sidebar
- [ ] Can create a job
- [ ] Can edit a job
- [ ] Can publish/pause/close a job

### Resume Processing
- [ ] Can upload single PDF
- [ ] Can upload single DOCX
- [ ] Can upload multiple files
- [ ] AI score appears within 30 seconds
- [ ] Candidate profile is created
- [ ] Score breakdown is visible

### Candidates
- [ ] Can view candidate list
- [ ] Can search/filter candidates
- [ ] Can view candidate profile
- [ ] Can see resume history
- [ ] Can see AI scores

### Team Features
- [ ] Can invite team member
- [ ] Invitation email received
- [ ] Can accept invitation
- [ ] Can see team members
- [ ] Can change roles (admin only)
- [ ] Activity feed shows actions

### Settings
- [ ] Can view billing page
- [ ] Can see usage stats
- [ ] Can see plan limits
- [ ] Upgrade prompts appear when needed

---

## Sample Test Data

### Test Job

```
Title: Senior Software Engineer
Description: We are looking for an experienced software engineer to join our team. You will work on building scalable web applications using modern technologies.

Requirements: JavaScript, React, Node.js, PostgreSQL, AWS

Location: Remote
Salary: $120,000 - $150,000
Type: Full-time
```

### Test Resumes

You can use any real or sample resumes. For best results:
- PDF format
- 1-3 pages
- English language
- Clear text (not scanned images)

---

## Reporting Issues

### Method 1: Email
Send bug reports to: **support@hirefit.io**

Subject format: `[BETA BUG] Brief description`

### Method 2: In-App
(Coming soon) Use the feedback button in the app

### Method 3: Shared Document
(If provided) Add to the shared testing spreadsheet

---

## Testing Schedule

| Phase | Focus | Duration |
|-------|-------|----------|
| Week 1 | Core flow (job + resume + scoring) | 3-4 days |
| Week 2 | Team features + edge cases | 3-4 days |
| Week 3 | Feedback consolidation | 2 days |

---

## FAQ for Testers

**Q: Is my data saved between sessions?**
A: Yes! Your jobs, candidates, and settings persist.

**Q: Can I delete test data?**
A: Not yet, but we can reset your account if needed.

**Q: What happens after beta?**
A: Beta testers may get special pricing or early access.

**Q: Who can see my data?**
A: Only you and your team members. Admins can see aggregated analytics.

---

## Contact

**Beta Coordinator**: [Your Name]  
**Email**: support@hirefit.io  
**Response Time**: Within 24 hours

---

## Thank You!

Your feedback is invaluable in making HireFit better. We appreciate your time and effort in testing!

🙏 The HireFit Team

