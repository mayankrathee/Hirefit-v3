# Azure Deployment Status

## Current Deployment URLs

| Service | Status | URL |
|---------|--------|-----|
| **API** | ✅ Running | `https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io` |
| **API Docs** | ✅ Running | `https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/docs` |
| **Frontend** | ⏳ Pending | Requires GitHub Actions deployment |

## Azure Resources Provisioned

| Resource | Name | Region |
|----------|------|--------|
| Resource Group | `hirefit-ai-rg` | East US |
| Container Registry | `hirefitacr` | East US |
| Container Apps Environment | `hirefit-env` | East US |
| Container App (API) | `hirefit-api-beta` | East US |
| Container App (Web) | `hirefit-web-beta` | East US |
| Azure OpenAI | `hirefit-openai` | East US |
| Document Intelligence | `hirefit-doc-intelligence` | East US |
| Service Bus | `hirefit-servicebus` | East US |
| Static Web App | `hirefit-web-beta` | East US 2 |

## Deploying the Frontend

The frontend requires building on Linux (not Windows) due to Next.js path handling. Use GitHub Actions:

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/hirefit.git
git push -u origin main
```

### 2. Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions, and add:

| Secret | Value |
|--------|-------|
| `ACR_USERNAME` | `hirefitacr` |
| `ACR_PASSWORD` | Run: `az acr credential show --name hirefitacr --query "passwords[0].value" -o tsv` |
| `AZURE_CREDENTIALS` | See below |

**To get AZURE_CREDENTIALS:**

```bash
az ad sp create-for-rbac --name "hirefit-github-deploy" --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/hirefit-ai-rg \
  --sdk-auth
```

Copy the entire JSON output as the `AZURE_CREDENTIALS` secret.

### 3. Trigger Deployment

Either:
- Push changes to `apps/web/` directory on main branch
- Go to Actions → "Deploy Frontend to Azure Container Apps" → Run workflow

## Verifying Deployment

### API Health Check

```bash
curl https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/health
```

### API AI Health Check

```bash
curl https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/health/ai
```

### View Logs

```bash
# API logs
az containerapp logs show --name hirefit-api-beta --resource-group hirefit-ai-rg --tail 50

# Frontend logs
az containerapp logs show --name hirefit-web-beta --resource-group hirefit-ai-rg --tail 50
```

## Costs

| Resource | Tier | Est. Monthly Cost |
|----------|------|-------------------|
| Container Apps | Consumption | ~$10-15 |
| Container Registry | Basic | ~$5 |
| Azure OpenAI | Pay-per-use | Variable |
| Document Intelligence | S0 | ~$1.50/1000 pages |
| Service Bus | Standard | ~$10 |

**Total estimated**: ~$30-50/month for testing

