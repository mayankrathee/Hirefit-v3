import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { ResumeProcessingService } from './resume-processing.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { UsageModule } from '../usage/usage.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [CandidatesModule, UsageModule, AIModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeProcessingService],
  exports: [ResumesService, ResumeProcessingService],
})
export class ResumesModule {}

