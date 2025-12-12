import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../interfaces';

/**
 * Azure Communication Services Email Provider
 * Sends emails via Azure Communication Services.
 */
export class AzureEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(AzureEmailProvider.name);
  private connectionString: string;
  private senderAddress: string;
  private client: any; // Will be typed when @azure/communication-email is installed

  constructor(private configService: ConfigService) {
    this.connectionString = this.configService.get<string>('AZURE_COMMUNICATION_CONNECTION_STRING') || '';
    this.senderAddress = this.configService.get<string>('AZURE_EMAIL_SENDER_ADDRESS') || 'DoNotReply@hirefit.io';

    if (!this.connectionString) {
      this.logger.warn('Azure Communication Services connection string not configured');
    }
  }

  private async getClient() {
    if (!this.client) {
      try {
        // Dynamic import to avoid build issues if package not installed
        // @ts-ignore - Package may not be installed in dev
        const { EmailClient } = await import('@azure/communication-email');
        this.client = new EmailClient(this.connectionString);
        this.logger.log('Azure Email client initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Azure Email client:', error);
        throw new Error('Azure Email client not available. Install @azure/communication-email package.');
      }
    }
    return this.client;
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    if (!this.connectionString) {
      this.logger.warn('Azure Email not configured, skipping send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const client = await this.getClient();
      const recipients = Array.isArray(input.to) ? input.to : [input.to];

      const emailMessage = {
        senderAddress: input.from?.email || this.senderAddress,
        content: {
          subject: input.subject,
          html: input.html,
          plainText: input.text || this.stripHtml(input.html),
        },
        recipients: {
          to: recipients.map(r => ({
            address: r.email,
            displayName: r.name || r.email,
          })),
        },
      };

      const poller = await client.beginSend(emailMessage);
      const result = await poller.pollUntilDone();

      if (result.status === 'Succeeded') {
        this.logger.log(`Email sent successfully to ${recipients.map(r => r.email).join(', ')}`);
        return {
          success: true,
          messageId: result.id,
        };
      } else {
        this.logger.error(`Email send failed: ${result.status}`);
        return {
          success: false,
          error: `Send failed with status: ${result.status}`,
        };
      }
    } catch (error) {
      this.logger.error('Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    if (!this.connectionString) {
      return { status: 'unhealthy', message: 'Connection string not configured' };
    }

    try {
      await this.getClient();
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}

