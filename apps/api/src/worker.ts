/**
 * Separate worker entrypoint.
 *
 * Boots the same Nest application context as the API but as a standalone
 * application — no HTTP listener. Used when the deployment wants to scale
 * queue throughput independently of the request-serving instances.
 *
 * Same `AppModule` so every provider (Prisma, Redis, BullMQ, notifications,
 * inventory domain, …) is wired identically. The processors registered via
 * `QueueService.registerWorker(...)` start consuming jobs as soon as the
 * context is created.
 *
 * Graceful shutdown via `enableShutdownHooks()` ensures in-flight jobs get
 * a chance to finish before BullMQ closes its connections.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const logger = app.get(Logger);
  logger.log('Worker process started — queues are accepting jobs.');

  // Keep the process alive. Nest's shutdown hooks handle SIGTERM/SIGINT,
  // call onModuleDestroy on every provider (drains BullMQ workers), then
  // exit cleanly.
  await new Promise<void>(() => {
    /* run until killed */
  });
}

void bootstrap();
