import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { getContext } from './request-context';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
  requestId?: string;
}

/**
 * Single JSON shape for all error responses. See docs/api-conventions.md.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const requestId = getContext()?.requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        message = typeof r.message === 'string' ? r.message : exception.message;
        if (Array.isArray(r.message)) {
          message = 'Validation failed';
          details = r.message;
        }
        code = typeof r.code === 'string' ? r.code : statusToCode(status);
      } else {
        message = exception.message;
        code = statusToCode(status);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
      message = 'Internal server error';
    } else {
      this.logger.error(`Unhandled non-error thrown: ${String(exception)}`);
    }

    const body: ErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
    if (requestId) body.requestId = requestId;
    res.status(status).json(body);
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'UNPROCESSABLE';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}
