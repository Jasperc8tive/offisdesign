import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { uuidv7 } from 'uuidv7';
import { runWithContext } from './request-context';

const HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.headers[HEADER];
    const requestId = typeof inbound === 'string' && inbound.length > 0 ? inbound : uuidv7();
    res.setHeader(HEADER, requestId);
    (req as Request & { requestId: string }).requestId = requestId;
    runWithContext(
      {
        requestId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      () => next(),
    );
  }
}
