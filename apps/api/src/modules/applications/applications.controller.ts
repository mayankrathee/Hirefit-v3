import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ApplicationsService, CreateApplicationDto, UpdateApplicationStatusDto, MoveStageDto } from './applications.service';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('applications')
@Controller('applications')
@ApiBearerAuth('JWT-auth')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Create a new application (link candidate to job)' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Application already exists' })
  create(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all applications with filters' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'candidateId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiResponse({ status: 200, description: 'List of applications' })
  findAll(
    @TenantId() tenantId: string,
    @Query('jobId') jobId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.applicationsService.findAll(tenantId, {
      jobId,
      candidateId,
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiResponse({ status: 200, description: 'Application statistics' })
  getStats(
    @TenantId() tenantId: string,
    @Query('jobId') jobId?: string,
  ) {
    return this.applicationsService.getStats(tenantId, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application details' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.findById(tenantId, id);
  }

  @Patch(':id/status')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER)
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  updateStatus(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(tenantId, userId, id, dto);
  }

  @Patch(':id/stage')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER)
  @ApiOperation({ summary: 'Move application to a different pipeline stage' })
  @ApiResponse({ status: 200, description: 'Stage updated' })
  moveStage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
  ) {
    return this.applicationsService.moveStage(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete application' })
  @ApiResponse({ status: 204, description: 'Application deleted' })
  remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.delete(tenantId, id);
  }
}

