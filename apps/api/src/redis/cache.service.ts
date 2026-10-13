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

  /**
   * Delete every key starting with `prefix` (SCAN + UNLINK in batches, so it
   * never blocks Redis). Redis is shared with sessions and queues, so callers
   * must pass a cache namespace, never an empty prefix.
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    if (!prefix) throw new Error('deleteByPrefix requires a non-empty prefix');
    let cursor = '0';
    let deleted = 0;
    do {
      const [next, keys] = await this.redis.client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        500,
      );
      cursor = next;
      if (keys.length > 0) deleted += await this.redis.client.unlink(...keys);
    } while (cursor !== '0');
    return deleted;
  }
}
