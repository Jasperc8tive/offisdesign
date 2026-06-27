import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Refresh tokens are tracked by JTI in Redis. The session row in Postgres is
 * the source of truth for "this session existed"; the Redis entry is the fast
 * check for "still valid". Logout = delete the Redis entry + mark the session
 * row revoked.
 */
@Injectable()
export class RefreshTokenStore {
  constructor(private readonly redis: RedisService) {}

  private key(jti: string): string {
    return `auth:refresh:${jti}`;
  }

  async track(jti: string, sessionId: string, ttlSec: number): Promise<void> {
    await this.redis.client.set(this.key(jti), sessionId, 'EX', ttlSec);
  }

  async lookup(jti: string): Promise<string | null> {
    return this.redis.client.get(this.key(jti));
  }

  async revoke(jti: string): Promise<void> {
    await this.redis.client.del(this.key(jti));
  }

  /** Rotate: revoke the old jti and track the new one in one round trip. */
  async rotate(oldJti: string, newJti: string, sessionId: string, ttlSec: number): Promise<void> {
    const pipeline = this.redis.client.multi();
    pipeline.del(this.key(oldJti));
    pipeline.set(this.key(newJti), sessionId, 'EX', ttlSec);
    await pipeline.exec();
  }
}
