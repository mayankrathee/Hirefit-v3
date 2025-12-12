/**
 * Queue Message Interfaces
 * Defines message contracts for Azure Service Bus queues
 */

/**
 * Base message interface for all queue messages
 */
export interface BaseQueueMessage {
  messageId: string;
  correlationId?: string;
  timestamp: Date;
  version: string;
}

/**
 * Resume processing queue message
 */
export interface ResumeProcessingMessage extends BaseQueueMessage {
  type: 'RESUME_PROCESSING';
  payload: {
    resumeId: string;
    jobId: string;
    tenantId: string;
    userId: string;
    storagePath: string;
    originalFileName: string;
    fileType: string;
  };
}

/**
 * Resume processing result message (for completion events)
 */
export interface ResumeProcessingResultMessage extends BaseQueueMessage {
  type: 'RESUME_PROCESSING_RESULT';
  payload: {
    resumeId: string;
    jobId: string;
    tenantId: string;
    status: 'completed' | 'failed';
    candidateId?: string;
    scores?: {
      overallScore: number;
      confidence: number;
    };
    error?: string;
    processingTime: number;
  };
}

/**
 * Union type for all queue messages
 */
export type QueueMessage = ResumeProcessingMessage | ResumeProcessingResultMessage;

/**
 * Message handler result
 */
export interface MessageHandlerResult {
  success: boolean;
  shouldRetry?: boolean;
  error?: string;
}

/**
 * Queue names used in the application
 */
export const QUEUE_NAMES = {
  RESUME_PROCESSING: 'resume-processing',
  RESUME_RESULTS: 'resume-results',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];


