# Azure AI Resources Setup Guide

This guide covers the Azure resources required for HireFit's AI integration using Microsoft Azure AI Foundry.

## Prerequisites

- Azure subscription with contributor access
- Azure CLI installed (`az --version`)
- Logged into Azure CLI (`az login`)

## Required Resources

| Resource | Purpose | SKU | Estimated Cost |
|----------|---------|-----|----------------|
| Azure AI Foundry | Agent orchestration hub | Standard | ~$0/month (pay per use) |
| Azure OpenAI | GPT-4 for analysis | Standard | ~$0.03/1K tokens |
| Azure Document Intelligence | PDF/DOC parsing | S0 | ~$1.50/1K pages |
| Azure Service Bus | Async queue | Standard | ~$10/month |
| Azure AI Search | Vector store (optional) | Basic | ~$70/month |

## Step 1: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="hirefit-ai-rg"
LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION
```

## Step 2: Create Azure OpenAI Resource

```bash
# Create Azure OpenAI resource
az cognitiveservices account create \
  --name hirefit-openai \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind OpenAI \
  --sku S0 \
  --custom-domain hirefit-openai

# Get endpoint and key
az cognitiveservices account show \
  --name hirefit-openai \
  --resource-group $RESOURCE_GROUP \
  --query "properties.endpoint" -o tsv

az cognitiveservices account keys list \
  --name hirefit-openai \
  --resource-group $RESOURCE_GROUP \
  --query "key1" -o tsv
```

### Deploy GPT-4 Model

```bash
# Deploy GPT-4 model
az cognitiveservices account deployment create \
  --name hirefit-openai \
  --resource-group $RESOURCE_GROUP \
  --deployment-name gpt-4 \
  --model-name gpt-4 \
  --model-version "0613" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard
```

## Step 3: Create Document Intelligence Resource

```bash
# Create Document Intelligence (Form Recognizer)
az cognitiveservices account create \
  --name hirefit-doc-intelligence \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind FormRecognizer \
  --sku S0

# Get endpoint and key
az cognitiveservices account show \
  --name hirefit-doc-intelligence \
  --resource-group $RESOURCE_GROUP \
  --query "properties.endpoint" -o tsv

az cognitiveservices account keys list \
  --name hirefit-doc-intelligence \
  --resource-group $RESOURCE_GROUP \
  --query "key1" -o tsv
```

## Step 4: Create Azure AI Foundry Project

Azure AI Foundry projects are created via the Azure Portal or Azure AI Studio:

1. Go to [Azure AI Studio](https://ai.azure.com)
2. Click "New project"
3. Configure:
   - **Project name**: `hirefit-ai`
   - **Hub**: Create new or select existing
   - **Region**: Same as other resources (eastus)
4. Connect resources:
   - Link your Azure OpenAI resource
   - Link your Document Intelligence resource
5. Note the project endpoint from the overview page

### Get Foundry Credentials

```bash
# The project endpoint will be in format:
# https://<hub-name>.services.ai.azure.com/api/projects/<project-name>

# Get connection string from Azure AI Studio > Project Settings > Keys
```

## Step 5: Create Azure Service Bus

```bash
# Create Service Bus namespace
az servicebus namespace create \
  --name hirefit-servicebus \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard

# Create queue for resume processing
az servicebus queue create \
  --name resume-processing \
  --namespace-name hirefit-servicebus \
  --resource-group $RESOURCE_GROUP \
  --max-size 1024 \
  --default-message-time-to-live P14D \
  --max-delivery-count 5 \
  --dead-lettering-on-message-expiration true

# Get connection string
az servicebus namespace authorization-rule keys list \
  --namespace-name hirefit-servicebus \
  --resource-group $RESOURCE_GROUP \
  --name RootManageSharedAccessKey \
  --query "primaryConnectionString" -o tsv
```

## Step 6: Create Azure AI Search (Optional - for Phase 2 Search)

```bash
# Create AI Search resource
az search service create \
  --name hirefit-search \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku basic \
  --partition-count 1 \
  --replica-count 1

# Get admin key
az search admin-key show \
  --service-name hirefit-search \
  --resource-group $RESOURCE_GROUP \
  --query "primaryKey" -o tsv
```

## Environment Configuration

After creating all resources, add these to your `.env` file:

```env
# AI Provider: 'mock' | 'foundry'
AI_PROVIDER=foundry

# Azure AI Foundry
AZURE_AI_FOUNDRY_ENDPOINT=https://<hub-name>.services.ai.azure.com
AZURE_AI_FOUNDRY_PROJECT=hirefit-ai
AZURE_AI_FOUNDRY_KEY=<your-project-key>

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://hirefit-openai.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_KEY=<your-openai-key>
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure Document Intelligence
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://hirefit-doc-intelligence.cognitiveservices.azure.com
AZURE_DOC_INTELLIGENCE_KEY=<your-doc-intelligence-key>

# Azure Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://hirefit-servicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>
AZURE_SERVICE_BUS_QUEUE_NAME=resume-processing

# Azure AI Search (Optional)
AZURE_SEARCH_ENDPOINT=https://hirefit-search.search.windows.net
AZURE_SEARCH_KEY=<your-search-admin-key>
AZURE_SEARCH_INDEX_NAME=candidates
```

## Development vs Production

### Development (Mock Mode)

For local development without Azure costs:

```env
AI_PROVIDER=mock
```

This uses the mock AI provider which simulates responses without calling Azure services.

### Production

```env
AI_PROVIDER=foundry
```

All Azure environment variables must be configured.

## Verifying Setup

Run the health check endpoint after configuration:

```bash
curl http://localhost:3001/api/health/ai
```

Expected response:
```json
{
  "status": "ok",
  "provider": "foundry",
  "services": {
    "openai": "connected",
    "documentIntelligence": "connected",
    "serviceBus": "connected"
  }
}
```

## Cost Management Tips

1. **Use mock mode for development** - saves costs during iteration
2. **Set Azure OpenAI rate limits** - prevent runaway costs
3. **Monitor usage** - use Azure Cost Management alerts
4. **Use reserved capacity** - for production workloads

## Troubleshooting

### "Model not found" error
- Ensure GPT-4 model is deployed with correct deployment name
- Check deployment status in Azure OpenAI Studio

### "Unauthorized" errors
- Verify API keys are correct
- Check resource RBAC permissions
- Ensure Foundry project has linked resources

### Service Bus connection issues
- Verify connection string includes SharedAccessKey
- Check firewall rules if using private endpoints
- Ensure queue exists with correct name

## Related Documentation

- [Azure AI Foundry Documentation](https://learn.microsoft.com/azure/ai-studio/)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure Document Intelligence](https://learn.microsoft.com/azure/ai-services/document-intelligence/)
- [Azure Service Bus](https://learn.microsoft.com/azure/service-bus-messaging/)


