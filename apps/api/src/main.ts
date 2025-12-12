import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  
  // CORS - Allow development and production origins
  const allowedOrigins = [
    configService.get<string>('WEB_URL') || 'http://localhost:3000',
    configService.get<string>('FRONTEND_URL'),
    'http://localhost:3002',
    'http://localhost:3003',
  ].filter(Boolean);
  
  // Azure Static Web Apps pattern
  const azureStaticWebAppsPattern = /\.azurestaticapps\.net$/;
  const azureContainerAppsPattern = /\.azurecontainerapps\.io$/;
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Check exact matches
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Check Azure patterns
      if (azureStaticWebAppsPattern.test(origin) || azureContainerAppsPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api', {
    exclude: ['health', 'ready'],
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation (enabled in all environments for beta testing)
  if (true) { // Always enable during beta - change to NODE_ENV check for production
    const config = new DocumentBuilder()
      .setTitle('HireFit API')
      .setDescription('AI-enabled Talent Acquisition Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Tenant-ID',
          in: 'header',
          description: 'Tenant identifier',
        },
        'tenant-id',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('tenants', 'Tenant management')
      .addTag('users', 'User management')
      .addTag('jobs', 'Job posting management')
      .addTag('candidates', 'Candidate management')
      .addTag('resumes', 'Resume processing')
      .addTag('evaluations', 'Interview evaluations')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 HireFit API Server                                   ║
║                                                           ║
║   Environment: ${configService.get<string>('NODE_ENV')?.padEnd(40)}║
║   Port: ${port.toString().padEnd(48)}║
║   API Docs: http://localhost:${port}/docs                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();

