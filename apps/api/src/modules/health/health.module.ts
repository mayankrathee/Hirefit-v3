import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [ConfigModule, AIModule],
  controllers: [HealthController],
})
export class HealthModule {}

