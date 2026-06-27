import { Global, Module } from '@nestjs/common';
import { loadApiEnv, type ApiEnv } from '@offisdesign/config';

export const API_ENV = Symbol('API_ENV');

@Global()
@Module({
  providers: [
    {
      provide: API_ENV,
      useFactory: (): ApiEnv => loadApiEnv(),
    },
  ],
  exports: [API_ENV],
})
export class ConfigModule {}
