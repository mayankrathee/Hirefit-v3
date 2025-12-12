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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/user.decorator';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@TenantId() tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create({
      ...createUserDto,
      tenantId,
    });
  }

  @Get()
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Get all users in tenant' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll(
    @TenantId() tenantId: string,
    @Query('isActive') isActive?: boolean,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll(tenantId, { isActive, role });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Users can only update certain fields on their own profile
    const allowedUpdates = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      phone: updateUserDto.phone,
      avatarUrl: updateUserDto.avatarUrl,
      timezone: updateUserDto.timezone,
    };
    return this.usersService.update(user.sub, allowedUpdates);
  }

  @Get(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN, Role.RECRUITER)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/deactivate')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Post(':id/activate')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.TENANT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}

