import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const SLOW_REQUEST_MS = 1000;

/**
 * Logs the duration of every HTTP request. Anything over SLOW_REQUEST_MS is
 * elevated to `warn` so dashboards and log-based alerts can latch on without
 * sampling the full request stream.
 */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method: string; originalUrl: string }>();
    const start = process.hrtime.bigint();
    return next.handle().pipe(
      tap({
        next: () => this.log(req, start, http.getResponse<{ statusCode: number }>().statusCode),
        error: () => this.log(req, start, undefined, true),
      }),
    );
  }

  private log(
    req: { method: string; originalUrl: string },
    start: bigint,
    status: number | undefined,
    failed = false,
  ): void {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    const line = `${req.method} ${req.originalUrl} ${status ?? 'ERR'} ${ms.toFixed(1)}ms`;
    if (failed || ms >= SLOW_REQUEST_MS) {
      this.logger.warn(line);
    } else {
      this.logger.debug(line);
    }
  }
}
