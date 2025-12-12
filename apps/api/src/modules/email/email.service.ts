import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailProvider,
  EMAIL_PROVIDER_TOKEN,
  SendEmailResult,
} from './interfaces';

export interface VerificationEmailData {
  email: string;
  firstName: string;
  verificationUrl: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  dashboardUrl: string;
}

export interface TeamInvitationEmailData {
  email: string;
  inviterName: string;
  teamName: string;
  role: string;
  invitationUrl: string;
  personalMessage?: string;
  expiresAt: Date;
}

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appName = 'HireFit';
  private readonly appUrl: string;
  private readonly supportEmail: string;

  constructor(
    @Inject(EMAIL_PROVIDER_TOKEN) private readonly emailProvider: IEmailProvider,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    this.supportEmail = this.configService.get<string>('SUPPORT_EMAIL') || 'support@hirefit.io';
  }

  // ============================================================================
  // VERIFICATION EMAILS
  // ============================================================================

  async sendVerificationEmail(data: VerificationEmailData): Promise<SendEmailResult> {
    const subject = `Verify your email - ${this.appName}`;
    const html = this.getVerificationEmailTemplate(data);

    return this.emailProvider.sendEmail({
      to: { email: data.email, name: data.firstName },
      subject,
      html,
      metadata: { type: 'verification' },
    });
  }

  // ============================================================================
  // WELCOME EMAILS
  // ============================================================================

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<SendEmailResult> {
    const subject = `Welcome to ${this.appName}! 🎉`;
    const html = this.getWelcomeEmailTemplate(data);

    return this.emailProvider.sendEmail({
      to: { email: data.email, name: data.firstName },
      subject,
      html,
      metadata: { type: 'welcome' },
    });
  }

  // ============================================================================
  // TEAM INVITATION EMAILS
  // ============================================================================

  async sendTeamInvitationEmail(data: TeamInvitationEmailData): Promise<SendEmailResult> {
    const subject = `You've been invited to join ${data.teamName} on ${this.appName}`;
    const html = this.getTeamInvitationEmailTemplate(data);

    return this.emailProvider.sendEmail({
      to: { email: data.email },
      subject,
      html,
      metadata: { type: 'team_invitation' },
    });
  }

  // ============================================================================
  // PASSWORD RESET EMAILS
  // ============================================================================

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
    const subject = `Reset your password - ${this.appName}`;
    const html = this.getPasswordResetEmailTemplate(data);

    return this.emailProvider.sendEmail({
      to: { email: data.email, name: data.firstName },
      subject,
      html,
      metadata: { type: 'password_reset' },
    });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async getHealth() {
    return this.emailProvider.getHealth();
  }

  // ============================================================================
  // EMAIL TEMPLATES
  // ============================================================================

  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.appName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 40px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #1a1a1a;
    }
    p {
      margin: 0 0 16px 0;
      color: #4a4a4a;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .button:hover {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
    }
    .secondary-text {
      font-size: 14px;
      color: #6b7280;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
    }
    .highlight-box {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .role-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">${this.appName}</div>
      ${content}
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
        <p>Questions? Contact us at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private getVerificationEmailTemplate(data: VerificationEmailData): string {
    const content = `
      <h1>Verify your email address</h1>
      <p>Hi ${data.firstName},</p>
      <p>Thanks for signing up for ${this.appName}! Please verify your email address to get started.</p>
      <a href="${data.verificationUrl}" class="button">Verify Email</a>
      <p class="secondary-text">This link will expire in 24 hours.</p>
      <p class="secondary-text">If you didn't create an account, you can safely ignore this email.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const content = `
      <h1>Welcome to ${this.appName}! 🎉</h1>
      <p>Hi ${data.firstName},</p>
      <p>Your account is all set up and ready to go. Here's what you can do next:</p>
      <div class="highlight-box">
        <p style="margin: 0;"><strong>🎯 Quick Start Guide:</strong></p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Create your first job posting</li>
          <li>Upload resumes for AI screening</li>
          <li>Review AI-scored candidates</li>
        </ul>
      </div>
      <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
      <p class="secondary-text">Need help? Check out our <a href="${this.appUrl}/docs">documentation</a> or reach out to our support team.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getTeamInvitationEmailTemplate(data: TeamInvitationEmailData): string {
    const formattedDate = data.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `
      <h1>You're invited to join ${data.teamName}</h1>
      <p><strong>${data.inviterName}</strong> has invited you to join their team on ${this.appName}.</p>
      ${data.personalMessage ? `
        <div class="highlight-box">
          <p style="margin: 0; font-style: italic;">"${data.personalMessage}"</p>
        </div>
      ` : ''}
      <p>You'll be joining as: <span class="role-badge">${this.formatRole(data.role)}</span></p>
      <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
      <p class="secondary-text">This invitation expires on ${formattedDate}.</p>
      <p class="secondary-text">If you don't want to join this team, you can safely ignore this email.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
    const content = `
      <h1>Reset your password</h1>
      <p>Hi ${data.firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password.</p>
      <a href="${data.resetUrl}" class="button">Reset Password</a>
      <p class="secondary-text">This link will expire in 1 hour.</p>
      <p class="secondary-text">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    `;
    return this.getBaseTemplate(content);
  }

  private formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      tenant_admin: 'Admin',
      hr_admin: 'HR Admin',
      recruiter: 'Recruiter',
      hiring_manager: 'Hiring Manager',
      viewer: 'Viewer',
    };
    return roleMap[role] || role;
  }
}

