import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER_TOKEN } from './interfaces';
import { ConsoleEmailProvider, AzureEmailProvider } from './providers';

const emailProviderFactory: Provider = {
  provide: EMAIL_PROVIDER_TOKEN,
  useFactory: (configService: ConfigService) => {
    const providerType = configService.get<string>('EMAIL_PROVIDER') || 'console';
    
    if (providerType === 'azure') {
      return new AzureEmailProvider(configService);
    }
    
    // Default to console provider for development
    return new ConsoleEmailProvider();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [emailProviderFactory, EmailService],
  exports: [EmailService],
})
export class EmailModule {}

