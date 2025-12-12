import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto, JobQueryDto } from './dto/job.dto';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';
import { RequireFeature } from '../../common/guards/feature.guard';
import { ResumeProcessingService } from '../resumes/resume-processing.service';

@ApiTags('jobs')
@Controller('jobs')
@ApiBearerAuth('JWT-auth')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly resumeProcessingService: ResumeProcessingService,
  ) {}

  @Post()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER)
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  create(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(tenantId, userId, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  findAll(@TenantId() tenantId: string, @Query() query: JobQueryDto) {
    return this.jobsService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, description: 'Job statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.jobsService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.jobsService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER, Role.HIRING_MANAGER)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(tenantId, id, updateJobDto);
  }

  @Post(':id/publish')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish job' })
  @ApiResponse({ status: 200, description: 'Job published' })
  publish(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.jobsService.publish(tenantId, id);
  }

  @Post(':id/pause')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause job' })
  @ApiResponse({ status: 200, description: 'Job paused' })
  pause(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.jobsService.pause(tenantId, id);
  }

  @Post(':id/close')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close job' })
  @ApiResponse({ status: 200, description: 'Job closed' })
  close(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.jobsService.close(tenantId, id);
  }

  @Post(':id/resumes')
  @RequireFeature({ featureId: 'ai_screening', trackUsage: false }) // Usage tracked in service
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files at once
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload resumes for a job (triggers AI evaluation)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Resumes uploaded and queued for processing' })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async uploadResumes(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Param('id') jobId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB per file
          new FileTypeValidator({
            fileType: /(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    // Verify job exists and belongs to tenant
    await this.jobsService.findById(tenantId, jobId);

    // Process each file
    const results = await Promise.all(
      files.map(file =>
        this.resumeProcessingService.uploadAndProcess(tenantId, userId, jobId, {
          originalFileName: file.originalname,
          fileType: file.mimetype,
          fileSizeBytes: file.size,
          buffer: file.buffer,
        }),
      ),
    );

    return {
      message: `${files.length} resume(s) uploaded and queued for processing`,
      uploads: results,
    };
  }

  @Get(':id/resumes/status')
  @RequireFeature('ai_screening') // Read access also requires feature
  @ApiOperation({ summary: 'Get processing status of resumes for a job' })
  @ApiResponse({ status: 200, description: 'Processing status' })
  async getResumeProcessingStatus(
    @TenantId() tenantId: string,
    @Param('id') jobId: string,
  ) {
    return this.resumeProcessingService.getJobProcessingStatus(tenantId, jobId);
  }

  @Delete(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 204, description: 'Job deleted' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.jobsService.delete(tenantId, id);
  }
}

