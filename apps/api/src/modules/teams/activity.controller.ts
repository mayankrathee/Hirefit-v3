import {
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService, ActivityQueryDto } from './activity.service';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('activity')
@Controller('activity')
@ApiBearerAuth('JWT-auth')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Get team activity feed' })
  @ApiResponse({ status: 200, description: 'Activity feed' })
  getActivity(@TenantId() tenantId: string, @Query() query: ActivityQueryDto) {
    return this.activityService.getActivity(tenantId, query);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent activity (dashboard)' })
  @ApiResponse({ status: 200, description: 'Recent activity' })
  getRecentActivity(@TenantId() tenantId: string, @Query('limit') limit?: number) {
    return this.activityService.getRecentActivity(tenantId, limit || 10);
  }

  @Get('users/:userId')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Get activity for specific user' })
  @ApiResponse({ status: 200, description: 'User activity' })
  getUserActivity(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.activityService.getUserActivity(tenantId, userId, limit || 20);
  }
}

