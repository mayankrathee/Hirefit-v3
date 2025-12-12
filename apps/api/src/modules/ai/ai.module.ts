import { Module, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { FeaturesModule } from '../features/features.module';

// Interfaces
import { AI_PROVIDER } from './interfaces/ai-provider.interface';

// Providers
import { MockAIProvider } from './providers/mock-ai.provider';
import { FoundryAIProvider } from './providers/foundry-ai.provider';

// Services
import { DocumentParserService } from './services/document-parser.service';
import { ResumeScoringAgentService } from './services/resume-scoring-agent.service';
import { QueuePublisherService } from './services/queue-publisher.service';
import { QueueProcessorService } from './services/queue-processor.service';

/**
 * AI Module
 * 
 * Provides AI capabilities for resume parsing and scoring using:
 * - Azure AI Foundry for agent orchestration
 * - Azure OpenAI for LLM analysis
 * - Azure Document Intelligence for document parsing
 * - Azure Service Bus for async processing
 * 
 * Supports mock provider for development/testing.
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    FeaturesModule,
  ],
  providers: [
    // AI Provider Factory - selects mock or foundry based on config
    {
      provide: AI_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get<string>('AI_PROVIDER', 'mock');
        const logger = new Logger('AIProviderFactory');
        
        if (provider === 'foundry') {
          logger.log('Initializing Foundry AI Provider');
          return new FoundryAIProvider(configService);
        }
        
        logger.log('Initializing Mock AI Provider');
        return new MockAIProvider();
      },
      inject: [ConfigService],
    },
    
    // Services
    DocumentParserService,
    ResumeScoringAgentService,
    QueuePublisherService,
    QueueProcessorService,
  ],
  exports: [
    AI_PROVIDER,
    DocumentParserService,
    ResumeScoringAgentService,
    QueuePublisherService,
  ],
})
export class AIModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AIModule.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly queueProcessor: QueueProcessorService,
  ) {}

  async onModuleInit() {
    const provider = this.configService.get<string>('AI_PROVIDER', 'mock');
    this.logger.log(`AI Module initialized with provider: ${provider}`);

    // Start queue processor if using foundry provider
    if (provider === 'foundry') {
      await this.queueProcessor.startProcessing();
      this.logger.log('Queue processor started');
    } else {
      this.logger.log('Queue processor skipped (mock mode)');
    }
  }

  async onModuleDestroy() {
    await this.queueProcessor.stopProcessing();
    this.logger.log('AI Module destroyed, queue processor stopped');
  }
}


