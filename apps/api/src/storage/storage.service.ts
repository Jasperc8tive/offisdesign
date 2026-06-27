import { Inject, Injectable } from '@nestjs/common';
import { LocalStorageDriver, S3StorageDriver, type StorageDriver } from '@offisdesign/storage';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';

@Injectable()
export class StorageService {
  readonly driver: StorageDriver;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    if (env.STORAGE_DRIVER === 's3') {
      if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
        throw new Error(
          'S3 storage driver requires S3_BUCKET/REGION/ACCESS_KEY_ID/SECRET_ACCESS_KEY',
        );
      }
      this.driver = new S3StorageDriver({
        bucket: env.S3_BUCKET,
        region: env.S3_REGION,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
        ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}),
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
      });
    } else {
      this.driver = new LocalStorageDriver({
        baseDir: env.STORAGE_LOCAL_DIR,
        publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
      });
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.driver.healthCheck();
  }
}
