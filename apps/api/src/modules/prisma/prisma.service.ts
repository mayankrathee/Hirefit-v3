import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const logLevels: Prisma.LogLevel[] =
      configService.get('NODE_ENV') === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'];

    super({
      log: logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
    });

    // Log queries in development
    if (configService.get('NODE_ENV') === 'development') {
      (this as any).$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
  }

  /**
   * Execute a query with tenant isolation
   * Sets the tenant context for row-level security
   */
  async withTenant<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
    // For SQL Server, we can use session context
    // This sets a context variable that RLS policies can use
    await this.$executeRaw`EXEC sp_set_session_context 'TenantId', ${tenantId}`;
    
    try {
      return await callback();
    } finally {
      // Clear the context after the operation
      await this.$executeRaw`EXEC sp_set_session_context 'TenantId', NULL`;
    }
  }

  /**
   * Create a transaction with tenant isolation
   */
  async transactionWithTenant<T>(
    tenantId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`EXEC sp_set_session_context 'TenantId', ${tenantId}`;
      return callback(tx);
    });
  }

  /**
   * Soft delete helper - updates isActive to false instead of deleting
   */
  async softDelete<T>(
    model: string,
    where: Record<string, any>,
  ): Promise<T> {
    return (this as any)[model].update({
      where,
      data: { isActive: false },
    });
  }

  /**
   * Health check - verifies database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}

