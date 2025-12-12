import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// @ts-ignore - passport-azure-ad has no types
import { BearerStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';

// Azure AD B2C / Entra ID Configuration
interface AzureAdConfig {
  identityMetadata: string;
  clientID: string;
  validateIssuer: boolean;
  issuer?: string;
  passReqToCallback: boolean;
  loggingLevel: string;
  loggingNoPII: boolean;
}

@Injectable()
export class AzureAdStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
  private readonly logger = new Logger(AzureAdStrategy.name);

  constructor(private configService: ConfigService) {
    const tenantId = configService.get<string>('azure.ad.tenantId');
    const clientId = configService.get<string>('azure.ad.clientId');

    const config: AzureAdConfig = {
      identityMetadata: `https://login.microsoftonline.com/${tenantId || 'common'}/v2.0/.well-known/openid-configuration`,
      clientID: clientId || '',
      validateIssuer: true,
      issuer: `https://login.microsoftonline.com/${tenantId || 'common'}/v2.0`,
      passReqToCallback: false,
      loggingLevel: 'warn',
      loggingNoPII: true,
    };

    super(config);
  }

  async validate(profile: any): Promise<any> {
    this.logger.debug(`Azure AD token validated for: ${profile.preferred_username || profile.email}`);
    
    return {
      oid: profile.oid,
      email: profile.preferred_username || profile.email,
      name: profile.name,
      given_name: profile.given_name,
      family_name: profile.family_name,
    };
  }
}

