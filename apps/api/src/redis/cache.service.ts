import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Minimal cache abstraction. Feature stages (catalogue, search) layer on top.
 */
@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSec) await this.redis.client.set(key, serialized, 'EX', ttlSec);
    else await this.redis.client.set(key, serialized);
  }

  async del(key: string): Promise<void> {
    await this.redis.client.del(key);
  }
}
