import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name', example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'acme-corp',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Custom domain for tenant',
    example: 'careers.acme.com',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  domain?: string;

  @ApiPropertyOptional({ description: 'Tenant settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Feature flags' })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Primary brand color', example: '#3B82F6' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Primary color must be a valid hex color',
  })
  primaryColor?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({ description: 'Subscription tier' })
  @IsString()
  @IsOptional()
  subscriptionTier?: string;

  @ApiPropertyOptional({ description: 'Subscription status' })
  @IsString()
  @IsOptional()
  subscriptionStatus?: string;

  @ApiPropertyOptional({ description: 'Is tenant active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TenantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  domain?: string;

  @ApiProperty()
  subscriptionTier: string;

  @ApiProperty()
  subscriptionStatus: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

