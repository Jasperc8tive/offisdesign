/**
 * Separate worker entrypoint.
 *
 * Boots the same Nest application context as the API but as a standalone
 * application — no HTTP listener. Used when the deployment wants to scale
 * queue throughput independently of the request-serving instances.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

// Hard cap on how long we wait for in-flight jobs to finish before exit(1).
// Should match (or be slightly less than) the deployment's
// terminationGracePeriodSeconds so k8s never needs to SIGKILL us.
const SHUTDOWN_TIMEOUT_MS = 25_000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const logger = app.get(Logger);
  logger.log('Worker process started — queues are accepting jobs.');

  const drain = async (signal: NodeJS.Signals): Promise<void> => {
    logger.log(`Received ${signal} — draining in-flight jobs (timeout ${SHUTDOWN_TIMEOUT_MS}ms).`);
    const hardExit = setTimeout(() => {
      logger.error('Drain timeout exceeded; forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    // Don't keep the event loop alive on the timer's account.
    hardExit.unref();

    try {
      await app.close();
      clearTimeout(hardExit);
      logger.log('Drain complete; exiting cleanly.');
      process.exit(0);
    } catch (err) {
      clearTimeout(hardExit);
      logger.error({ err }, 'Drain failed; exiting with error.');
      process.exit(1);
    }
  };

  process.once('SIGTERM', () => void drain('SIGTERM'));
  process.once('SIGINT', () => void drain('SIGINT'));

  await new Promise<void>(() => {
    /* run until SIGTERM/SIGINT triggers drain() above */
  });
}

void bootstrap();
