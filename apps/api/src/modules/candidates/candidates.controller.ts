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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto, UpdateCandidateDto, CandidateQueryDto } from './dto/candidate.dto';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { UserId } from '../../common/decorators/user.decorator';

@ApiTags('candidates')
@Controller('candidates')
@ApiBearerAuth('JWT-auth')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Create a new candidate' })
  @ApiResponse({ status: 201, description: 'Candidate created successfully' })
  @ApiResponse({ status: 409, description: 'Candidate already exists' })
  create(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() createCandidateDto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(tenantId, userId, createCandidateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  findAll(@TenantId() tenantId: string, @Query() query: CandidateQueryDto) {
    return this.candidatesService.findAll(tenantId, query);
  }

  @Get('stats')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Get candidate statistics' })
  @ApiResponse({ status: 200, description: 'Candidate statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.candidatesService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  @ApiResponse({ status: 200, description: 'Candidate details' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.candidatesService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Update candidate' })
  @ApiResponse({ status: 200, description: 'Candidate updated successfully' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(tenantId, id, updateCandidateDto);
  }

  @Post(':id/tags')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add tags to candidate' })
  @ApiResponse({ status: 200, description: 'Tags added' })
  addTags(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.candidatesService.addTags(tenantId, id, tags);
  }

  @Delete(':id/tags')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove tags from candidate' })
  @ApiResponse({ status: 200, description: 'Tags removed' })
  removeTags(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.candidatesService.removeTags(tenantId, id, tags);
  }

  @Post(':id/deactivate')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate candidate' })
  @ApiResponse({ status: 200, description: 'Candidate deactivated' })
  deactivate(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.candidatesService.deactivate(tenantId, id);
  }
}

