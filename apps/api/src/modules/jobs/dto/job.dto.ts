import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsObject,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum JobStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAUSED = 'paused',
  CLOSED = 'closed',
  FILLED = 'filled',
}

export enum LocationType {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
}

export class CreateJobDto {
  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Job description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Engineering' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  department?: string;

  @ApiPropertyOptional({ description: 'Location', example: 'New York, NY' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Location type',
    enum: LocationType,
    default: LocationType.ONSITE,
  })
  @IsEnum(LocationType)
  @IsOptional()
  locationType?: string;

  @ApiPropertyOptional({ description: 'Job requirements as JSON' })
  @IsObject()
  @IsOptional()
  requirements?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Minimum salary', example: 100000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Maximum salary', example: 150000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Salary currency', default: 'USD' })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  salaryCurrency?: string;

  @ApiPropertyOptional({
    description: 'Employment type',
    enum: EmploymentType,
    default: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: string;

  @ApiPropertyOptional({ description: 'AI scoring rubric configuration' })
  @IsObject()
  @IsOptional()
  scoringRubric?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Pipeline stages',
    type: [String],
    example: ['new', 'screening', 'interview', 'offer', 'hired'],
  })
  @IsArray()
  @IsOptional()
  pipelineStages?: string[];
}

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @ApiPropertyOptional({
    description: 'Job status',
    enum: JobStatus,
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: string;
}

export class JobQueryDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  pageSize?: number;
}

