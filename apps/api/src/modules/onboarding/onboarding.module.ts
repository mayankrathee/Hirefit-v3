import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [OnboardingService],
  controllers: [OnboardingController],
  exports: [OnboardingService],
})
export class OnboardingModule {}

