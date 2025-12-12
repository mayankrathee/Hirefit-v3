import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient, ServiceBusSender } from '@azure/service-bus';
import { v4 as uuidv4 } from 'uuid';
import {
  ResumeProcessingMessage,
  QUEUE_NAMES,
} from '../interfaces/queue-message.interface';

/**
 * Queue Publisher Service
 * 
 * Publishes messages to Azure Service Bus queues.
 * Used to enqueue resume processing jobs for async handling.
 */
@Injectable()
export class QueuePublisherService implements OnModuleDestroy {
  private readonly logger = new Logger(QueuePublisherService.name);
  
  private client: ServiceBusClient | null = null;
  private sender: ServiceBusSender | null = null;
  
  private readonly connectionString: string;
  private readonly queueName: string;
  private readonly isEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.connectionString = this.configService.get<string>('AZURE_SERVICE_BUS_CONNECTION_STRING', '');
    this.queueName = this.configService.get<string>('AZURE_SERVICE_BUS_QUEUE_NAME', QUEUE_NAMES.RESUME_PROCESSING);
    
    const provider = this.configService.get<string>('AI_PROVIDER', 'mock');
    this.isEnabled = provider === 'foundry' && !!this.connectionString;

    if (this.isEnabled) {
      this.logger.log(`Queue publisher enabled for queue: ${this.queueName}`);
    } else {
      this.logger.log('Queue publisher disabled (mock mode or missing connection string)');
    }
  }

  /**
   * Get or create Service Bus sender
   */
  private async getSender(): Promise<ServiceBusSender> {
    if (!this.isEnabled) {
      throw new Error('Queue publisher is not enabled');
    }

    if (!this.sender) {
      this.client = new ServiceBusClient(this.connectionString);
      this.sender = this.client.createSender(this.queueName);
      this.logger.debug('Service Bus sender initialized');
    }

    return this.sender;
  }

  /**
   * Enqueue a resume for processing
   */
  async enqueueResumeProcessing(params: {
    resumeId: string;
    jobId: string;
    tenantId: string;
    userId: string;
    storagePath: string;
    originalFileName: string;
    fileType: string;
  }): Promise<{ messageId: string; enqueued: boolean }> {
    const messageId = uuidv4();

    // If queue is disabled (mock mode), return immediately
    if (!this.isEnabled) {
      this.logger.debug(`Queue disabled, skipping enqueue for resume ${params.resumeId}`);
      return { messageId, enqueued: false };
    }

    const message: ResumeProcessingMessage = {
      messageId,
      timestamp: new Date(),
      version: '1.0',
      type: 'RESUME_PROCESSING',
      payload: {
        resumeId: params.resumeId,
        jobId: params.jobId,
        tenantId: params.tenantId,
        userId: params.userId,
        storagePath: params.storagePath,
        originalFileName: params.originalFileName,
        fileType: params.fileType,
      },
    };

    try {
      const sender = await this.getSender();
      
      await sender.sendMessages({
        body: message,
        messageId,
        contentType: 'application/json',
        subject: 'resume-processing',
        applicationProperties: {
          tenantId: params.tenantId,
          resumeId: params.resumeId,
          jobId: params.jobId,
        },
      });

      this.logger.log(
        `Enqueued resume processing: ${params.resumeId} (messageId: ${messageId})`,
      );

      return { messageId, enqueued: true };
    } catch (error) {
      this.logger.error(`Failed to enqueue resume ${params.resumeId}: ${error.message}`);
      throw new Error(`Failed to enqueue resume processing: ${error.message}`);
    }
  }

  /**
   * Check if queue publisher is enabled
   */
  isQueueEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Health check for queue connection
   */
  async healthCheck(): Promise<{
    status: 'ok' | 'disabled' | 'error';
    queue: string;
    error?: string;
  }> {
    if (!this.isEnabled) {
      return { status: 'disabled', queue: this.queueName };
    }

    try {
      await this.getSender();
      return { status: 'ok', queue: this.queueName };
    } catch (error) {
      return { 
        status: 'error', 
        queue: this.queueName, 
        error: error.message,
      };
    }
  }

  /**
   * Close connections on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.sender) {
      await this.sender.close();
      this.sender = null;
    }
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.logger.log('Queue publisher connections closed');
  }
}


