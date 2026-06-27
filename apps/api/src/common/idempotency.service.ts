import { ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const TTL_HOURS = 24;

/**
 * Generic idempotency cache. Callers supply a key (typically from an
 * `Idempotency-Key` header), the request body for hash comparison, and a
 * factory that performs the actual side effect. Replay of the same key with
 * the same body returns the stored response; replay with a different body
 * returns 409.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    key: string,
    request: unknown,
    statusCode: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const requestHash = hash(request);
    const existing = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          code: 'IDEMPOTENCY_MISMATCH',
          message: 'Idempotency key reused with a different request body.',
        });
      }
      return existing.response as T;
    }
    const response = await factory();
    await this.prisma.idempotencyKey
      .create({
        data: {
          key,
          requestHash,
          response: response as object,
          statusCode,
          expiresAt: new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000),
        },
      })
      .catch(() => {
        // Race: another writer beat us. Fall through and rely on the existing row.
      });
    return response;
  }
}

function hash(obj: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(obj ?? null))
    .digest('hex');
}
