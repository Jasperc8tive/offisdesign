import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QueueService } from '../queue/queue.service';
import { StorageService } from '../storage/storage.service';

@Controller('v1/system')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: QueueService,
    private readonly storage: StorageService,
  ) {}

  /** Liveness — process is alive. Never touches dependencies. */
  @Get('livez')
  @HttpCode(200)
  liveness() {
    return { status: 'ok' };
  }

  /** Readiness — all critical dependencies respond. Returns 503 when degraded. */
  @Get('readyz')
  async readiness(@Res() res: Response): Promise<void> {
    const checks = await this.collect();
    const allOk = Object.values(checks).every(Boolean);
    res.status(allOk ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: allOk ? 'ok' : 'degraded',
      checks,
    });
  }

  /** Detailed health — used by ops dashboards. Always 200; the body tells the truth. */
  @Get('healthz')
  async health() {
    const checks = await this.collect();
    return {
      status: Object.values(checks).every(Boolean) ? 'ok' : 'degraded',
      checks,
    };
  }

  private async collect(): Promise<Record<string, boolean>> {
    const [database, redis, queue, storage] = await Promise.all([
      this.prisma.healthCheck(),
      this.redis.healthCheck(),
      this.queue.healthCheck(),
      this.storage.healthCheck(),
    ]);
    return { database, redis, queue, storage };
  }
}
