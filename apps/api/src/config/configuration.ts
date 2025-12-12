export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Azure AD
  azure: {
    ad: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      redirectUri: process.env.AZURE_AD_REDIRECT_URI,
    },
    storage: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerResumes: process.env.AZURE_STORAGE_CONTAINER_RESUMES || 'resumes',
      containerDocuments: process.env.AZURE_STORAGE_CONTAINER_DOCUMENTS || 'documents',
    },
    keyVault: {
      url: process.env.AZURE_KEY_VAULT_URL,
    },
    serviceBus: {
      connectionString: process.env.AZURE_SERVICE_BUS_CONNECTION_STRING,
    },
    redis: {
      connectionString: process.env.AZURE_REDIS_CONNECTION_STRING,
    },
    search: {
      endpoint: process.env.AZURE_COGNITIVE_SEARCH_ENDPOINT,
      key: process.env.AZURE_COGNITIVE_SEARCH_KEY,
      indexName: process.env.AZURE_COGNITIVE_SEARCH_INDEX || 'candidates',
    },
    openai: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      key: process.env.AZURE_OPENAI_KEY,
      deploymentGpt4: process.env.AZURE_OPENAI_DEPLOYMENT_GPT4 || 'gpt-4',
      deploymentGpt35: process.env.AZURE_OPENAI_DEPLOYMENT_GPT35 || 'gpt-35-turbo',
    },
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  },

  // Feature flags
  features: {
    aiScoring: process.env.FEATURE_AI_SCORING === 'true',
    recording: process.env.FEATURE_RECORDING === 'true',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
});

