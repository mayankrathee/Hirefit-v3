import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenantCheck } from '../../common/guards/tenant.guard';
import { AI_PROVIDER, IAIProvider } from '../ai/interfaces/ai-provider.interface';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

@ApiTags('health')
@Controller()
@Public()
@SkipTenantCheck()
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Optional() @Inject(AI_PROVIDER) private aiProvider?: IAIProvider,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async health(): Promise<HealthStatus> {
    const checks = await this.performChecks();
    
    const status = this.determineOverallStatus(checks);
    
    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<{ ready: boolean; timestamp: string }> {
    const dbHealthy = await this.checkDatabase();
    
    return {
      ready: dbHealthy.status === 'up',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): { alive: boolean; timestamp: string } {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ai')
  @ApiOperation({ summary: 'AI services health check' })
  @ApiResponse({ status: 200, description: 'AI services status' })
  async aiHealth(): Promise<{
    provider: string;
    status: 'ok' | 'degraded' | 'error' | 'disabled';
    details?: Record<string, string>;
    timestamp: string;
  }> {
    const provider = this.configService.get<string>('AI_PROVIDER', 'mock');
    
    if (!this.aiProvider) {
      return {
        provider,
        status: 'disabled',
        details: { message: 'AI provider not configured' },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const health = await this.aiProvider.healthCheck();
      return {
        provider: this.aiProvider.name,
        status: health.status,
        details: health.details,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        provider,
        status: 'error',
        details: { error: error.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async performChecks() {
    const [database, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    return { database, memory };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    latency?: number;
  }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      
      return { status: 'up', latency };
    } catch (error) {
      return { status: 'down' };
    }
  }

  private checkMemory(): {
    status: 'ok' | 'warning' | 'critical';
    used: number;
    total: number;
    percentage: number;
  } {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    const percentage = Math.round((used / total) * 100);

    let status: 'ok' | 'warning' | 'critical';
    if (percentage < 70) {
      status = 'ok';
    } else if (percentage < 90) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      status,
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage,
    };
  }

  private determineOverallStatus(checks: any): 'healthy' | 'unhealthy' | 'degraded' {
    if (checks.database.status === 'down') {
      return 'unhealthy';
    }
    
    if (checks.memory.status === 'critical') {
      return 'unhealthy';
    }
    
    if (checks.memory.status === 'warning') {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

