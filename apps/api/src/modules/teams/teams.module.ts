import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { InvitationController } from './invitation.controller';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,
    forwardRef(() => UsersModule),
  ],
  providers: [TeamsService, ActivityService],
  controllers: [TeamsController, InvitationController, ActivityController],
  exports: [TeamsService, ActivityService],
})
export class TeamsModule {}

