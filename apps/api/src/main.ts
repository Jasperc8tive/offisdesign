import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadApiEnv } from '@offisdesign/config';

async function bootstrap(): Promise<void> {
  const env = loadApiEnv();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL],
      credentials: true,
    },
  });

  // Wire shutdown hooks. Nest's `enableShutdownHooks` listens for SIGTERM and
  // SIGINT, then triggers `onModuleDestroy` on every provider that implements
  // it — including QueueService, PrismaService, and RedisService. This is
  // the difference between a graceful drain and a SIGKILL on rollout.
  app.enableShutdownHooks();

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());

  // Capture raw body on payment webhook routes so signature verification works.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl?.startsWith('/v1/payments/webhook')) {
      express.json({
        verify: (r, _res, buf) => {
          (r as unknown as { rawBody: Buffer }).rawBody = buf;
        },
      })(req, res, next);
    } else {
      next();
    }
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (env.OPENAPI_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('Offisdesign API')
      .setDescription('Stage 4 — backend foundation. Endpoints land in feature stages.')
      .setVersion('0.1.0')
      .addCookieAuth('offis_at')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc, { customSiteTitle: 'Offisdesign API' });
  }

  await app.listen(env.API_PORT, env.API_HOST);
  app.get(Logger).log(`API listening on http://${env.API_HOST}:${env.API_PORT}`);
}

void bootstrap();
