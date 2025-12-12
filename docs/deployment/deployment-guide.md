# HireFit Deployment Guide

**Version**: 1.0  
**Last Updated**: December 12, 2024  
**Platform Status**: Ready for Beta Testing

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Azure Resources](#azure-resources)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | Runtime |
| npm | 9.x or higher | Package manager |
| Git | Latest | Version control |

### Azure Resources (Production)

| Resource | Purpose | Required |
|----------|---------|----------|
| Azure OpenAI | AI resume analysis | Yes |
| Azure Document Intelligence | PDF/DOC parsing | Yes |
| Azure Service Bus | Async processing | Yes |
| Azure SQL Database | Data storage | Recommended |
| Azure Communication Services | Email sending | Optional |

---

## Environment Configuration

### Development Environment

Create `apps/api/.env`:

```env
# Application
NODE_ENV=development
PORT=3001

# Database (SQLite for dev)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Storage
UPLOAD_DIR=./uploads/resumes

# AI Provider (mock for development)
AI_PROVIDER=mock

# Email Provider (console for dev)
EMAIL_PROVIDER=console

# Application URLs
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=HireFit
```

### Production Environment

Create `apps/api/.env`:

```env
# Application
NODE_ENV=production
PORT=3001

# Database (Azure SQL)
DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=hirefit;user=your-user;password=your-password;encrypt=true"

# Authentication
JWT_SECRET=<generate-strong-256-bit-secret>
JWT_EXPIRES_IN=7d

# Azure AD SSO (Optional)
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_REDIRECT_URI=https://your-domain.com/api/auth/azure-ad/callback

# AI Provider
AI_PROVIDER=foundry

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_KEY=<your-openai-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure Document Intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-doc-intel.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=<your-doc-intel-key>

# Azure Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>
AZURE_SERVICE_BUS_QUEUE_NAME=resume-processing

# Email Provider
EMAIL_PROVIDER=azure
AZURE_COMMUNICATION_CONNECTION_STRING=<your-connection-string>
AZURE_EMAIL_SENDER_ADDRESS=DoNotReply@your-domain.com
SUPPORT_EMAIL=support@your-domain.com

# Application URLs
APP_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com

# File Storage
AZURE_STORAGE_ACCOUNT_NAME=<storage-account>
AZURE_STORAGE_ACCOUNT_KEY=<storage-key>
AZURE_STORAGE_CONTAINER_NAME=resumes

# Logging
LOG_LEVEL=info
```

---

## Database Setup

### Development (SQLite)

```bash
cd apps/api

# Create database and apply schema
npx prisma db push

# Seed initial data (feature definitions)
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

### Production (Azure SQL)

1. Create Azure SQL Database
2. Update `DATABASE_URL` in `.env`
3. Run migrations:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

---

## Azure Resources

### Required Resources

See [Azure AI Setup Guide](azure-ai-setup.md) for detailed provisioning instructions.

**Quick Reference**:

```bash
# Create resource group
az group create --name hirefit-rg --location eastus

# Create Azure OpenAI
az cognitiveservices account create \
  --name hirefit-openai \
  --resource-group hirefit-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Create Document Intelligence
az cognitiveservices account create \
  --name hirefit-doc-intel \
  --resource-group hirefit-rg \
  --kind FormRecognizer \
  --sku S0 \
  --location eastus

# Create Service Bus
az servicebus namespace create \
  --name hirefit-servicebus \
  --resource-group hirefit-rg \
  --sku Standard \
  --location eastus

az servicebus queue create \
  --resource-group hirefit-rg \
  --namespace-name hirefit-servicebus \
  --name resume-processing
```

---

## Deployment Options

### Option 1: Local Development

```bash
# Clone repository
git clone <repo-url>
cd hirefit-v3

# Install dependencies
npm install

# Setup database
cd apps/api
npx prisma db push
npx prisma db seed
cd ../..

# Start development servers
npm run dev
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs

### Option 2: Docker Deployment

```dockerfile
# Dockerfile (API)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api

COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/main"]
```

```bash
# Build and run
docker build -f apps/api/Dockerfile -t hirefit-api .
docker run -p 3001:3001 --env-file apps/api/.env hirefit-api
```

### Option 3: Azure App Service

1. Create Azure App Service (Node.js 18 LTS)
2. Configure environment variables
3. Deploy via GitHub Actions or Azure CLI:

```bash
# Deploy API
az webapp up --name hirefit-api --resource-group hirefit-rg --runtime "NODE:18-lts"

# Deploy Frontend (Static Web Apps)
az staticwebapp create --name hirefit-web --resource-group hirefit-rg
```

---

## Post-Deployment Verification

### Health Checks

```bash
# API health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-12-12T...",
  "database": "connected",
  "uptime": 123
}

# AI health
curl https://your-domain.com/api/health/ai

# Expected response:
{
  "status": "healthy",
  "ai": {
    "provider": "foundry",
    "status": "healthy",
    "queue": { "status": "healthy" }
  }
}
```

### Functional Tests

1. **Demo Login**: Go to `/login` and click "Demo Login"
2. **Create Job**: Navigate to Jobs → New Job
3. **Upload Resume**: Upload a PDF/DOC resume to a job
4. **Check AI Processing**: Wait for AI score to appear

### Checklist

- [ ] API health endpoint returns "ok"
- [ ] AI health endpoint returns "healthy"
- [ ] Demo login works
- [ ] Can create a job
- [ ] Resume upload works
- [ ] AI scoring completes (check logs)
- [ ] Emails send (check console or actual delivery)

---

## Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: Can't reach database server
```
Solution: Verify `DATABASE_URL` and network access rules

**AI Provider Not Configured**
```
Error: Azure OpenAI endpoint not configured
```
Solution: Set all `AZURE_OPENAI_*` environment variables

**Resume Processing Fails**
```
Error: Failed to process resume
```
Solution: Check Service Bus connection and Document Intelligence credentials

### Logs

```bash
# View API logs (development)
cd apps/api
npm run start:dev

# View logs in Azure
az webapp log tail --name hirefit-api --resource-group hirefit-rg
```

### Support

- Documentation: `/docs`
- API Reference: `/api/docs` (Swagger)
- Support Email: support@hirefit.io

---

## Security Checklist

- [ ] Strong JWT secret (256 bits minimum)
- [ ] Azure resources use managed identities where possible
- [ ] Database has firewall rules
- [ ] HTTPS enabled for all endpoints
- [ ] Environment variables not committed to git
- [ ] Secrets stored in Azure Key Vault (production)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-12 | HireFit Team | Initial deployment guide |

