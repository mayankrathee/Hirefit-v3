import { Module, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailModule } from '../email/email.module';
import { FeaturesModule } from '../features/features.module';

// Conditionally import Azure AD strategy only if credentials are configured
const azureAdProviders: Provider[] = [];
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_TENANT_ID) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AzureAdStrategy } = require('./strategies/azure-ad.strategy');
  azureAdProviders.push(AzureAdStrategy);
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    TenantsModule,
    EmailModule,
    FeaturesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...azureAdProviders],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

