import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { API_ENV } from '../config/config.module';
import type { ApiEnv } from '@offisdesign/config';

@Injectable()
export class PasswordService {
  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.env.BCRYPT_ROUNDS);
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
