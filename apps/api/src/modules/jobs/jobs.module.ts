import { Module, forwardRef } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { ResumesModule } from '../resumes/resumes.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [forwardRef(() => ResumesModule), UsageModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

