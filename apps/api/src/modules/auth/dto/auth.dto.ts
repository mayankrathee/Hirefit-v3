import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AzureAdProfileDto {
  @ApiProperty({ description: 'Azure AD Object ID' })
  @IsString()
  @IsNotEmpty()
  oid: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Full name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsString()
  @IsOptional()
  given_name?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsString()
  @IsOptional()
  family_name?: string;
}

export class AzureAdCallbackDto {
  @ApiProperty({ description: 'Azure AD user profile' })
  @ValidateNested()
  @Type(() => AzureAdProfileDto)
  profile: AzureAdProfileDto;

  @ApiPropertyOptional({ description: 'Tenant slug for multi-tenant login' })
  @IsString()
  @IsOptional()
  tenantSlug?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LoginDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: 'Tenant slug (optional)' })
  @IsString()
  @IsOptional()
  tenantSlug?: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'Token type (Bearer)' })
  tokenType: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    tenantName: string;
  };
}

