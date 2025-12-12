import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  IsArray,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCandidateDto {
  @ApiProperty({ description: 'Candidate email', example: 'john.doe@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
  @IsUrl()
  @IsOptional()
  linkedInUrl?: string;

  @ApiPropertyOptional({ description: 'Personal website URL' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Source of candidate', example: 'linkedin' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ description: 'Additional source details' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  sourceDetails?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {}

export class CandidateQueryDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by source' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsArray()
  @IsOptional()
  tags?: string[];

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

