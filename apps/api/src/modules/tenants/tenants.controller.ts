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
import { TenantsService, TenantRegistrationDto, IndividualRegistrationDto } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('tenants')
@Controller('tenants')
@ApiBearerAuth('JWT-auth')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 409, description: 'Slug or domain already exists' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Post('signup')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Individual user signup (primary flow)' })
  @ApiResponse({ status: 201, description: 'Signup successful - personal workspace created' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 400, description: 'Invalid signup data' })
  async signup(@Body() signupDto: IndividualRegistrationDto) {
    return this.tenantsService.registerIndividual(signupDto);
  }

  @Post('register')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Company/enterprise registration (secondary flow)' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 409, description: 'Company or email already registered' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(@Body() registrationDto: TenantRegistrationDto) {
    return this.tenantsService.register(registrationDto);
  }

  @Get('check-slug')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Check if a company slug is available' })
  @ApiQuery({ name: 'slug', description: 'Company slug to check' })
  @ApiResponse({ status: 200, description: 'Availability status' })
  async checkSlugAvailability(@Query('slug') slug: string) {
    return this.tenantsService.checkSlugAvailability(slug);
  }

  @Get()
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get all tenants (system admin only)' })
  @ApiResponse({ status: 200, description: 'List of all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant details' })
  @ApiResponse({ status: 200, description: 'Current tenant details' })
  async getCurrentTenant(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Get('current/stats')
  @Roles(Role.TENANT_ADMIN, Role.HR_ADMIN)
  @ApiOperation({ summary: 'Get current tenant statistics' })
  @ApiResponse({ status: 200, description: 'Tenant statistics' })
  async getCurrentTenantStats(@TenantId() tenantId: string) {
    return this.tenantsService.getStats(tenantId);
  }

  @Get('by-slug/:slug')
  @Public()
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get tenant by slug (for login)' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Get(':id')
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get tenant by ID (system admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Patch('current')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update current tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  updateCurrent(
    @TenantId() tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(tenantId, updateTenantDto);
  }

  @Post('current/convert-to-company')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Convert personal workspace to company account' })
  @ApiResponse({ status: 200, description: 'Workspace converted successfully' })
  @ApiResponse({ status: 400, description: 'Already a company workspace' })
  @ApiResponse({ status: 409, description: 'Company name already in use' })
  async convertToCompany(
    @TenantId() tenantId: string,
    @Body() body: { companyName: string; companySlug?: string },
  ) {
    return this.tenantsService.convertToCompany(tenantId, body.companyName, body.companySlug);
  }

  @Patch('current/settings')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update current tenant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateCurrentSettings(
    @TenantId() tenantId: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.tenantsService.updateSettings(tenantId, settings);
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Update tenant by ID (system admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Post(':id/deactivate')
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deactivated' })
  deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }

  @Post(':id/activate')
  @Roles(Role.SYSTEM_ADMIN)
  @SkipTenantCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiResponse({ status: 200, description: 'Tenant activated' })
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }
}

