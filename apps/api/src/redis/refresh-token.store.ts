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

  async revokeMany(jtis: string[]): Promise<void> {
    if (jtis.length === 0) return;
    await this.redis.client.del(...jtis.map((j) => this.key(j)));
  }

  /**
   * Atomically read-and-delete a JTI (MULTI GET + DEL), so of several
   * concurrent refreshes with the same token exactly one gets the session id.
   */
  async claim(jti: string): Promise<string | null> {
    const results = await this.redis.client.multi().get(this.key(jti)).del(this.key(jti)).exec();
    const [getErr, value] = results?.[0] ?? [null, null];
    if (getErr) throw getErr;
    return (value as string | null) ?? null;
  }
}
