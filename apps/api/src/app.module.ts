import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config
import configuration from './config/configuration';
import { validate } from './config/env.validation';

// Common
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

// Modules
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { UsageModule } from './modules/usage/usage.module';
import { FeaturesModule } from './modules/features/features.module';
import { HealthModule } from './modules/health/health.module';
import { AIModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { TeamsModule } from './modules/teams/teams.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { FeatureGuard } from './common/guards/feature.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Core modules
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    JobsModule,
    CandidatesModule,
    ResumesModule,
    ApplicationsModule,
    UsageModule,
    FeaturesModule,
    HealthModule,
    AIModule,
    EmailModule,
    TeamsModule,
    OnboardingModule,
  ],
  providers: [
    // Global guards (order matters)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, TenantMiddleware)
      .forRoutes('*');
  }
}

