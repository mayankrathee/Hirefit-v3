# HireFit Quick Start for Testers

## 🚀 Getting Started

### API Access (Ready Now)

The API is deployed and fully functional:

- **API Base URL**: `https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api`
- **API Documentation**: `https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/docs`

### Frontend (Requires GitHub Deployment)

The frontend needs to be deployed via GitHub Actions. See `azure-deployment-status.md` for instructions.

---

## 🔑 Using the API

### 1. Create a Demo Tenant

```bash
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "tenantName": "Test Company"
  }'
```

### 2. Login

```bash
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

This returns a JWT token. Use it in the `Authorization` header for subsequent requests:

```bash
Authorization: Bearer <your-token>
```

### 3. Create a Job

```bash
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "Senior Developer",
    "description": "We are looking for a senior developer...",
    "requirements": "5+ years experience, TypeScript, React",
    "department": "Engineering",
    "location": "Remote",
    "locationType": "remote",
    "employmentType": "full_time"
  }'
```

### 4. Upload a Resume

```bash
curl -X POST https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api/jobs/<job-id>/resumes \
  -H "Authorization: Bearer <your-token>" \
  -F "file=@resume.pdf"
```

The AI will automatically:
1. Parse the resume using Azure Document Intelligence
2. Score the candidate against the job requirements using GPT-4o-mini
3. Return match scores and explanations

---

## 📊 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs/:id/resumes` | Upload resume |
| GET | `/api/applications` | List applications |
| GET | `/health` | API health check |
| GET | `/health/ai` | AI services status |

See full API documentation at: `https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/docs`

---

## 🧪 Testing the AI

To test the AI resume scoring:

1. Create a job with specific requirements
2. Upload a resume (PDF or DOCX)
3. Check the application for AI scores

The AI evaluates:
- **Skills Match** (0-100): How well the candidate's skills match requirements
- **Experience Match** (0-100): Relevance of work experience
- **Education Match** (0-100): Education alignment
- **Overall Fit** (0-100): Holistic assessment
- **Explanation**: AI-generated summary of the candidate's fit

---

## 🐛 Reporting Issues

Please report any issues with:
1. The endpoint you were calling
2. The request body (if applicable)
3. The error message received
4. Steps to reproduce

---

## 📞 Support

Contact the development team for assistance.

