import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';

/**
 * Public invitation controller (no authentication required)
 * Handles invitation acceptance flow
 */
@ApiTags('invitations')
@Controller('invitations')
@Public()
@SkipTenantCheck()
export class InvitationController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Invitation expired or invalid' })
  getInvitation(@Param('token') token: string) {
    return this.teamsService.getInvitationByToken(token);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Accept invitation and create user' })
  @ApiResponse({ status: 201, description: 'Invitation accepted, user created' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 400, description: 'Invitation expired or already accepted' })
  acceptInvitation(
    @Param('token') token: string,
    @Body() body: {
      firstName: string;
      lastName: string;
      externalId?: string;
    },
  ) {
    return this.teamsService.acceptInvitation(token, body);
  }
}

