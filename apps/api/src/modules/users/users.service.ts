import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto & { tenantId: string }) {
    // Check if email is unique within tenant
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: createUserDto.tenantId,
          email: createUserDto.email.toLowerCase(),
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in tenant');
    }

    const user = await this.prisma.user.create({
      data: {
        tenantId: createUserDto.tenantId,
        email: createUserDto.email.toLowerCase(),
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phone: createUserDto.phone,
        role: createUserDto.role || 'viewer',
        externalId: createUserDto.externalId,
        permissions: JSON.stringify(createUserDto.permissions || []),
      },
    });

    this.logger.log(`Created user: ${user.email} in tenant ${user.tenantId}`);
    return this.sanitizeUser(user);
  }

  async findAll(tenantId: string, options?: { isActive?: boolean; role?: string }) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: options?.isActive,
        role: options?.role,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(this.sanitizeUser);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase(),
        },
      },
    });
  }

  async findByExternalId(externalId: string) {
    return this.prisma.user.findFirst({
      where: { externalId },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        phone: updateUserDto.phone,
        role: updateUserDto.role,
        avatarUrl: updateUserDto.avatarUrl,
        timezone: updateUserDto.timezone,
        permissions: updateUserDto.permissions ? JSON.stringify(updateUserDto.permissions) : undefined,
        externalId: updateUserDto.externalId,
      },
    });

    return this.sanitizeUser(user);
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async deactivate(id: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`Deleted user: ${id}`);
  }

  private sanitizeUser(user: any) {
    // Remove sensitive fields
    const { ...sanitized } = user;
    return sanitized;
  }
}

