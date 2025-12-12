import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default feature definitions for the HireFit platform
 * These define the modular features available in the system
 */
const FEATURES = [
  {
    id: 'core',
    name: 'Core Platform',
    description: 'Candidates, Jobs, Resume Management - Essential platform features',
    category: 'core',
    type: 'standard',
    defaultEnabled: true,
    usageLimited: false,
    defaultLimit: null,
    sortOrder: 1,
  },
  {
    id: 'ai_screening',
    name: 'AI Resume Screening',
    description: 'AI-powered resume parsing, analysis, and scoring against job requirements',
    category: 'ai',
    type: 'freemium',
    defaultEnabled: true,
    usageLimited: true,
    defaultLimit: 20, // 20 AI scores per month on free tier
    sortOrder: 2,
  },
  {
    id: 'ai_interview',
    name: 'AI Interview Evaluation',
    description: 'AI-assisted candidate evaluation during interviews with structured feedback',
    category: 'ai',
    type: 'premium',
    defaultEnabled: false,
    usageLimited: true,
    defaultLimit: 10,
    sortOrder: 3,
  },
  {
    id: 'scheduler',
    name: 'Interview Scheduler',
    description: 'Calendar integration and automated interview scheduling with candidates',
    category: 'scheduling',
    type: 'addon',
    defaultEnabled: false,
    usageLimited: false,
    defaultLimit: null,
    sortOrder: 4,
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Comprehensive hiring metrics, reports, and pipeline analytics',
    category: 'analytics',
    type: 'premium',
    defaultEnabled: false,
    usageLimited: false,
    defaultLimit: null,
    sortOrder: 5,
  },
  {
    id: 'integrations',
    name: 'ATS/HRIS Integrations',
    description: 'Connect to external systems like Workday, Greenhouse, Lever, etc.',
    category: 'integrations',
    type: 'enterprise',
    defaultEnabled: false,
    usageLimited: false,
    defaultLimit: null,
    sortOrder: 6,
  },
];

/**
 * Subscription tier to feature mapping
 * Defines which features are included in each subscription tier
 */
const TIER_FEATURES: Record<string, { features: string[]; limits?: Record<string, number> }> = {
  free: {
    features: ['core', 'ai_screening'],
    limits: {
      ai_screening: 20,
    },
  },
  pro: {
    features: ['core', 'ai_screening', 'scheduler'],
    limits: {
      ai_screening: 100,
    },
  },
  team: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview'],
    limits: {
      ai_screening: 500,
      ai_interview: 50,
    },
  },
  enterprise: {
    features: ['core', 'ai_screening', 'scheduler', 'analytics', 'ai_interview', 'integrations'],
    limits: {
      // Unlimited - no limits
    },
  },
};

async function seedFeatures() {
  console.log('🌱 Seeding feature definitions...');

  for (const feature of FEATURES) {
    await prisma.featureDefinition.upsert({
      where: { id: feature.id },
      update: {
        name: feature.name,
        description: feature.description,
        category: feature.category,
        type: feature.type,
        defaultEnabled: feature.defaultEnabled,
        usageLimited: feature.usageLimited,
        defaultLimit: feature.defaultLimit,
        sortOrder: feature.sortOrder,
      },
      create: feature,
    });
    console.log(`  ✓ Feature: ${feature.name} (${feature.id})`);
  }

  console.log(`\n✅ Seeded ${FEATURES.length} feature definitions`);
}

async function seedTenantFeatures() {
  console.log('\n🌱 Initializing tenant features...');

  // Get all tenants that don't have feature entries yet
  const tenants = await prisma.tenant.findMany({
    include: {
      tenantFeatures: true,
    },
  });

  for (const tenant of tenants) {
    const tierConfig = TIER_FEATURES[tenant.subscriptionTier] || TIER_FEATURES.free;
    const existingFeatureIds = tenant.tenantFeatures.map((tf) => tf.featureId);

    for (const featureId of tierConfig.features) {
      if (!existingFeatureIds.includes(featureId)) {
        const customLimit = tierConfig.limits?.[featureId];
        await prisma.tenantFeature.create({
          data: {
            tenantId: tenant.id,
            featureId: featureId,
            enabled: true,
            usageLimit: customLimit || null,
          },
        });
        console.log(`  ✓ Enabled ${featureId} for tenant ${tenant.name}`);
      }
    }
  }

  console.log('\n✅ Tenant features initialized');
}

async function main() {
  console.log('🚀 Starting HireFit database seed...\n');

  await seedFeatures();
  await seedTenantFeatures();

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Export tier configuration for use in feature service
export { TIER_FEATURES, FEATURES };

