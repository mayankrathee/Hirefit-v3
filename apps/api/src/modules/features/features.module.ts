import { Module, Global } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global() // Make FeaturesService available globally for guards
@Module({
  imports: [PrismaModule],
  providers: [FeaturesService],
  controllers: [FeaturesController],
  exports: [FeaturesService],
})
export class FeaturesModule {}

