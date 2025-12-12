# Environment Configuration

This document describes all environment variables required for the HireFit API.

## Quick Start

Create a `.env` file in `apps/api/` with the following configuration.

## Development Configuration (Mock AI)

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# File Storage
UPLOAD_DIR=./uploads/resumes

# AI Provider (mock for development)
AI_PROVIDER=mock

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## Production Configuration (Azure AI Foundry)

```env
# Application
NODE_ENV=production
PORT=3001

# Database (Azure SQL)
DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=hirefit;user=your-user;password=your-password;encrypt=true"

# Authentication
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d

# Azure AD SSO
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
AZURE_AD_REDIRECT_URI=https://your-domain.com/api/auth/azure-ad/callback

# File Storage (Azure Blob)
AZURE_STORAGE_ACCOUNT_NAME=<storage-account>
AZURE_STORAGE_ACCOUNT_KEY=<storage-key>
AZURE_STORAGE_CONTAINER_NAME=resumes

# AI Provider
AI_PROVIDER=foundry

# Azure AI Foundry
AZURE_AI_FOUNDRY_ENDPOINT=https://<hub-name>.services.ai.azure.com
AZURE_AI_FOUNDRY_PROJECT=hirefit-ai
AZURE_AI_FOUNDRY_KEY=<your-foundry-key>

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_KEY=<your-openai-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure Document Intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://<resource>.cognitiveservices.azure.com
AZURE_DOC_INTELLIGENCE_KEY=<your-doc-intelligence-key>

# Azure Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>
AZURE_SERVICE_BUS_QUEUE_NAME=resume-processing

# Azure AI Search (optional)
AZURE_SEARCH_ENDPOINT=https://<search-service>.search.windows.net
AZURE_SEARCH_KEY=<your-search-key>
AZURE_SEARCH_INDEX_NAME=candidates

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Logging
LOG_LEVEL=info
```

## Environment Variables Reference

### Application Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | API server port | `3001` | Yes |
| `LOG_LEVEL` | Logging level | `debug` | No |

### Database

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Prisma database connection string | - | Yes |

### Authentication

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret for signing JWT tokens | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` | No |
| `AZURE_AD_CLIENT_ID` | Azure AD application ID | - | For SSO |
| `AZURE_AD_CLIENT_SECRET` | Azure AD client secret | - | For SSO |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID | - | For SSO |
| `AZURE_AD_REDIRECT_URI` | OAuth callback URL | - | For SSO |

### AI Provider

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AI_PROVIDER` | AI provider mode (`mock` or `foundry`) | `mock` | Yes |

### Azure AI Foundry

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_AI_FOUNDRY_ENDPOINT` | Foundry project endpoint | - | When `AI_PROVIDER=foundry` |
| `AZURE_AI_FOUNDRY_PROJECT` | Foundry project name | - | When `AI_PROVIDER=foundry` |
| `AZURE_AI_FOUNDRY_KEY` | Foundry API key | - | When `AI_PROVIDER=foundry` |

### Azure OpenAI

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_OPENAI_ENDPOINT` | OpenAI resource endpoint | - | When `AI_PROVIDER=foundry` |
| `AZURE_OPENAI_KEY` | OpenAI API key | - | When `AI_PROVIDER=foundry` |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name | `gpt-4` | When `AI_PROVIDER=foundry` |
| `AZURE_OPENAI_API_VERSION` | API version | `2024-02-15-preview` | No |

### Azure Document Intelligence

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_DOC_INTELLIGENCE_ENDPOINT` | Document Intelligence endpoint | - | When `AI_PROVIDER=foundry` |
| `AZURE_DOC_INTELLIGENCE_KEY` | Document Intelligence key | - | When `AI_PROVIDER=foundry` |

### Azure Service Bus

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Service Bus connection string | - | When `AI_PROVIDER=foundry` |
| `AZURE_SERVICE_BUS_QUEUE_NAME` | Queue name for resume processing | `resume-processing` | When `AI_PROVIDER=foundry` |

### Azure Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | Local upload directory | `./uploads/resumes` | For dev |
| `AZURE_STORAGE_ACCOUNT_NAME` | Blob storage account | - | For prod |
| `AZURE_STORAGE_ACCOUNT_KEY` | Blob storage key | - | For prod |
| `AZURE_STORAGE_CONTAINER_NAME` | Blob container name | `resumes` | For prod |

### Email Service

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAIL_PROVIDER` | Email provider (`console` or `azure`) | `console` | No |
| `AZURE_COMMUNICATION_CONNECTION_STRING` | Azure Communication Services connection string | - | When `EMAIL_PROVIDER=azure` |
| `AZURE_EMAIL_SENDER_ADDRESS` | Sender email address | `DoNotReply@hirefit.io` | For prod |
| `SUPPORT_EMAIL` | Support email address | `support@hirefit.io` | No |
| `APP_URL` | Application base URL (for emails) | `http://localhost:3000` | Yes |

## Switching Between Mock and Azure AI

### Development (Mock)
```env
AI_PROVIDER=mock
```
- No Azure resources required
- Uses simulated AI responses
- Instant feedback for testing

### Production (Azure)
```env
AI_PROVIDER=foundry
```
- Requires all Azure AI resources configured
- Real document parsing with Document Intelligence
- GPT-4 powered resume analysis
- Async processing via Service Bus

## Security Notes

1. **Never commit `.env` files** - They contain secrets
2. **Use Azure Key Vault** - For production secret management
3. **Rotate secrets regularly** - Especially after team changes
4. **Use managed identities** - When possible in Azure


