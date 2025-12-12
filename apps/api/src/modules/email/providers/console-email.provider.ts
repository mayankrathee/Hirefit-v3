import { Logger } from '@nestjs/common';
import {
  IEmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../interfaces';

/**
 * Console Email Provider
 * Logs emails to console instead of sending them.
 * Used for development and testing.
 */
export class ConsoleEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const recipientEmails = recipients.map(r => r.email).join(', ');

    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log('📧 EMAIL (Console Provider - Not Actually Sent)');
    this.logger.log('═══════════════════════════════════════════════════════');
    this.logger.log(`To: ${recipientEmails}`);
    this.logger.log(`Subject: ${input.subject}`);
    if (input.from) {
      this.logger.log(`From: ${input.from.name || ''} <${input.from.email}>`);
    }
    this.logger.log('───────────────────────────────────────────────────────');
    this.logger.log('Content:');
    this.logger.log(input.text || this.stripHtml(input.html));
    this.logger.log('═══════════════════════════════════════════════════════');

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  async getHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message?: string }> {
    return { status: 'healthy', message: 'Console provider always healthy' };
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

