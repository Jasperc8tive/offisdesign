import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { RefreshTokenStore } from './refresh-token.store';

@Global()
@Module({
  providers: [RedisService, CacheService, RefreshTokenStore],
  exports: [RedisService, CacheService, RefreshTokenStore],
})
export class RedisModule {}
