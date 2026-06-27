import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueEvents, Worker, type ConnectionOptions, type Processor } from 'bullmq';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';
import { RedisService } from '../redis/redis.service';

interface RegisteredQueue {
  queue: Queue;
  events: QueueEvents;
  worker?: Worker;
}

/**
 * Centralised BullMQ wiring. Feature modules call `registerQueue('name')` and
 * register their workers via `registerWorker`. No jobs are defined yet.
 *
 * Dead-letter handling: when a job exhausts retries BullMQ moves it to the
 * `failed` set automatically. A monitor hook surfaces failures via logger.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, RegisteredQueue>();

  constructor(
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly redis: RedisService,
  ) {}

  private connection(): ConnectionOptions {
    // BullMQ accepts host/port directly. Passing the URL through avoids
    // coupling to the ioredis instance type, which can drift between hoisted
    // versions in the workspace.
    const url = new URL(this.env.REDIS_URL);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      ...(url.password ? { password: url.password } : {}),
      ...(url.username ? { username: url.username } : {}),
    };
  }

  registerQueue(name: string): Queue {
    const existing = this.queues.get(name);
    if (existing) return existing.queue;

    const queue = new Queue(name, {
      connection: this.connection(),
      prefix: this.env.QUEUE_PREFIX,
      defaultJobOptions: {
        attempts: this.env.QUEUE_DEFAULT_ATTEMPTS,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 60 * 60, count: 1000 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    });

    const events = new QueueEvents(name, {
      connection: this.connection(),
      prefix: this.env.QUEUE_PREFIX,
    });

    events.on('failed', ({ jobId, failedReason }) => {
      this.logger.warn(`[${name}] job ${jobId} failed: ${failedReason}`);
    });

    this.queues.set(name, { queue, events });
    return queue;
  }

  registerWorker<TData, TResult>(name: string, processor: Processor<TData, TResult>): Worker {
    const reg = this.queues.get(name);
    if (!reg) throw new Error(`Queue "${name}" not registered`);
    const worker = new Worker<TData, TResult>(name, processor, {
      connection: this.connection(),
      prefix: this.env.QUEUE_PREFIX,
    });
    worker.on('failed', (job, err) => {
      this.logger.error(`[${name}] worker job ${job?.id} failed: ${err.message}`);
    });
    reg.worker = worker;
    return worker;
  }

  async healthCheck(): Promise<boolean> {
    // BullMQ piggybacks on Redis — if Redis is up, queue infra is up.
    return this.redis.healthCheck();
  }

  async onModuleDestroy(): Promise<void> {
    for (const [, reg] of this.queues) {
      await reg.worker?.close();
      await reg.events.close();
      await reg.queue.close();
    }
  }
}
