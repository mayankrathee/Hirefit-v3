export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
  metadata?: Record<string, string>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
  getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }>;
}

export const EMAIL_PROVIDER_TOKEN = 'IEmailProvider';

