import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadApiEnv } from '@offisdesign/config';
import { TimingInterceptor } from './common/timing.interceptor';

const JSON_LIMIT = '2mb';
const WEBHOOK_LIMIT = '1mb';

async function bootstrap(): Promise<void> {
  const env = loadApiEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Disable Nest's default body parser so we can set explicit size limits and
    // preserve the raw body for Stripe webhook signature verification.
    bodyParser: false,
    cors: {
      origin: [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL],
      credentials: true,
    },
  });

  // Trust the reverse proxy (LB / ingress) one hop deep so req.ip reflects the
  // real client address. Required for accurate rate limiting and audit logs.
  app.set('trust proxy', 1);

  app.enableShutdownHooks();

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(cookieParser());

  // Capture raw body on payment webhook routes so signature verification works.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl?.startsWith('/v1/payments/webhook')) {
      express.json({
        limit: WEBHOOK_LIMIT,
        verify: (r, _res, buf) => {
          (r as unknown as { rawBody: Buffer }).rawBody = buf;
        },
      })(req, res, next);
    } else {
      next();
    }
  });
  // Default JSON / form parsers for every other route, with explicit limits.
  // Without these, a fresh deploy uses Express's 100KB default and bulk imports
  // or large carts get rejected with no obvious error.
  app.use(express.json({ limit: JSON_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TimingInterceptor());

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
