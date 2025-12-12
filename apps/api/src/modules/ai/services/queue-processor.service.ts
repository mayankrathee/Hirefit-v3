import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusReceivedMessage,
  ProcessErrorArgs,
} from '@azure/service-bus';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentParserService } from './document-parser.service';
import { ResumeScoringAgentService } from './resume-scoring-agent.service';
import {
  ResumeProcessingMessage,
  QUEUE_NAMES,
} from '../interfaces/queue-message.interface';

/**
 * Queue Processor Service
 * 
 * Consumes messages from Azure Service Bus and processes resumes.
 * Handles:
 * - Document parsing
 * - AI scoring
 * - Database updates
 * - Error handling and dead-letter
 */
@Injectable()
export class QueueProcessorService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueProcessorService.name);

  private client: ServiceBusClient | null = null;
  private receiver: ServiceBusReceiver | null = null;
  private isProcessing = false;

  private readonly connectionString: string;
  private readonly queueName: string;
  private readonly isEnabled: boolean;
  private readonly uploadDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly documentParser: DocumentParserService,
    private readonly resumeScoringAgent: ResumeScoringAgentService,
  ) {
    this.connectionString = this.configService.get<string>('AZURE_SERVICE_BUS_CONNECTION_STRING', '');
    this.queueName = this.configService.get<string>('AZURE_SERVICE_BUS_QUEUE_NAME', QUEUE_NAMES.RESUME_PROCESSING);
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads', 'resumes');

    const provider = this.configService.get<string>('AI_PROVIDER', 'mock');
    this.isEnabled = provider === 'foundry' && !!this.connectionString;
  }

  /**
   * Start processing messages from the queue
   */
  async startProcessing(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log('Queue processor disabled (mock mode or missing connection string)');
      return;
    }

    if (this.isProcessing) {
      this.logger.warn('Queue processor already running');
      return;
    }

    try {
      this.client = new ServiceBusClient(this.connectionString);
      this.receiver = this.client.createReceiver(this.queueName, {
        receiveMode: 'peekLock', // Messages are locked until completed/abandoned
      });

      // Subscribe to messages
      this.receiver.subscribe(
        {
          processMessage: this.handleMessage.bind(this),
          processError: this.handleError.bind(this),
        },
        {
          maxConcurrentCalls: 3, // Process up to 3 messages concurrently
          autoCompleteMessages: false, // Manual completion for reliability
        },
      );

      this.isProcessing = true;
      this.logger.log(`Queue processor started, listening on: ${this.queueName}`);
    } catch (error) {
      this.logger.error(`Failed to start queue processor: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop processing messages
   */
  async stopProcessing(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    try {
      if (this.receiver) {
        await this.receiver.close();
        this.receiver = null;
      }
      if (this.client) {
        await this.client.close();
        this.client = null;
      }
      this.isProcessing = false;
      this.logger.log('Queue processor stopped');
    } catch (error) {
      this.logger.error(`Error stopping queue processor: ${error.message}`);
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(message: ServiceBusReceivedMessage): Promise<void> {
    const startTime = Date.now();
    const messageId = message.messageId?.toString() || 'unknown';

    this.logger.log(`Processing message: ${messageId}`);

    try {
      // Parse message body
      const queueMessage = message.body as ResumeProcessingMessage;

      if (queueMessage.type !== 'RESUME_PROCESSING') {
        this.logger.warn(`Unknown message type: ${queueMessage.type}`);
        await this.receiver?.completeMessage(message);
        return;
      }

      const { payload } = queueMessage;
      const { resumeId, jobId, tenantId, userId, storagePath, originalFileName, fileType } = payload;

      this.logger.debug(`Processing resume ${resumeId} for job ${jobId}`);

      // Load file from storage
      const filePath = path.join(this.uploadDir, storagePath);
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const buffer = await fs.promises.readFile(filePath);

      // Parse document
      const parseResult = await this.documentParser.parseDocument(buffer, originalFileName, fileType);

      // Score resume
      await this.resumeScoringAgent.processResume(
        resumeId,
        jobId,
        tenantId,
        userId,
        parseResult.text,
      );

      // Complete message (remove from queue)
      await this.receiver?.completeMessage(message);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Message ${messageId} processed successfully in ${processingTime}ms`,
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `Message ${messageId} failed after ${processingTime}ms: ${error.message}`,
      );

      // Check delivery count for dead-letter decision
      const deliveryCount = message.deliveryCount || 0;
      const maxDeliveryCount = 5;

      if (deliveryCount >= maxDeliveryCount - 1) {
        // Move to dead-letter queue
        this.logger.warn(`Message ${messageId} moving to dead-letter after ${deliveryCount} attempts`);
        await this.receiver?.deadLetterMessage(message, {
          deadLetterReason: 'MaxRetriesExceeded',
          deadLetterErrorDescription: error.message,
        });
      } else {
        // Abandon message for retry
        this.logger.debug(`Message ${messageId} abandoned for retry (attempt ${deliveryCount + 1})`);
        await this.receiver?.abandonMessage(message);
      }

      // Update resume status
      try {
        const queueMessage = message.body as ResumeProcessingMessage;
        if (queueMessage?.payload?.resumeId) {
          await this.prisma.resume.update({
            where: { id: queueMessage.payload.resumeId },
            data: {
              processingStatus: deliveryCount >= maxDeliveryCount - 1 ? 'failed' : 'processing',
              processingError: error.message,
            },
          });
        }
      } catch (updateError) {
        this.logger.error(`Failed to update resume status: ${updateError.message}`);
      }
    }
  }

  /**
   * Handle processing errors
   */
  private async handleError(args: ProcessErrorArgs): Promise<void> {
    this.logger.error(
      `Queue processor error: ${args.error.message}`,
      {
        errorSource: args.errorSource,
        entityPath: args.entityPath,
        fullyQualifiedNamespace: args.fullyQualifiedNamespace,
      },
    );
  }

  /**
   * Check if processor is running
   */
  isRunning(): boolean {
    return this.isProcessing;
  }

  /**
   * Get processor status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    queue: string;
  } {
    return {
      enabled: this.isEnabled,
      running: this.isProcessing,
      queue: this.queueName,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.stopProcessing();
  }
}


