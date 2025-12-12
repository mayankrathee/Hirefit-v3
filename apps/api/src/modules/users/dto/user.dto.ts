import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsUUID,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Role } from '../../../common/decorators/roles.decorator';

export class CreateUserDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
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

  @ApiPropertyOptional({
    description: 'User role',
    enum: Role,
    default: Role.VIEWER,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'Azure AD external ID' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ description: 'User permissions', type: [String] })
  @IsArray()
  @IsOptional()
  permissions?: string[];
}

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['tenantId', 'email'] as const),
) {
  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'America/New_York' })
  @IsString()
  @IsOptional()
  timezone?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

