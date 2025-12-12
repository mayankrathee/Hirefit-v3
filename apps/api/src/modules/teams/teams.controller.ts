import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService, InviteTeamMemberDto, UpdateTeamMemberRoleDto } from './teams.service';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('teams')
@Controller('teams')
@ApiBearerAuth('JWT-auth')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // ============================================================================
  // TEAM MEMBERS
  // ============================================================================

  @Get('members')
  @ApiOperation({ summary: 'Get all team members' })
  @ApiResponse({ status: 200, description: 'List of team members' })
  getTeamMembers(@TenantId() tenantId: string) {
    return this.teamsService.getTeamMembers(tenantId);
  }

  @Get('members/:id')
  @ApiOperation({ summary: 'Get team member by ID' })
  @ApiResponse({ status: 200, description: 'Team member details' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  getTeamMember(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.teamsService.getTeamMemberById(tenantId, id);
  }

  @Patch('members/:id/role')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update team member role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  updateMemberRole(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') memberId: string,
    @Body() dto: UpdateTeamMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(tenantId, memberId, dto, userId);
  }

  @Delete('members/:id')
  @Roles(Role.TENANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove team member' })
  @ApiResponse({ status: 200, description: 'Team member removed' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  removeMember(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') memberId: string,
  ) {
    return this.teamsService.removeMember(tenantId, memberId, userId);
  }

  // ============================================================================
  // INVITATIONS
  // ============================================================================

  @Get('invitations')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Get pending invitations' })
  @ApiResponse({ status: 200, description: 'List of pending invitations' })
  getPendingInvitations(@TenantId() tenantId: string) {
    return this.teamsService.getPendingInvitations(tenantId);
  }

  @Post('invitations')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Invite a team member' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  @ApiResponse({ status: 409, description: 'Email already exists or invitation pending' })
  inviteTeamMember(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.teamsService.inviteTeamMember(tenantId, userId, dto);
  }

  @Post('invitations/:id/resend')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend invitation' })
  @ApiResponse({ status: 200, description: 'Invitation resent' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  resendInvitation(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') invitationId: string,
  ) {
    return this.teamsService.resendInvitation(tenantId, invitationId, userId);
  }

  @Delete('invitations/:id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  revokeInvitation(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') invitationId: string,
  ) {
    return this.teamsService.revokeInvitation(tenantId, invitationId, userId);
  }

  // ============================================================================
  // TEAM STATS
  // ============================================================================

  @Get('stats')
  @ApiOperation({ summary: 'Get team statistics' })
  @ApiResponse({ status: 200, description: 'Team statistics' })
  getTeamStats(@TenantId() tenantId: string) {
    return this.teamsService.getTeamStats(tenantId);
  }
}

