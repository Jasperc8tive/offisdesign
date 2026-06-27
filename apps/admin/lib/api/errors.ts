/**
 * Admin-side API error wrapper. Mirrors the storefront's shape so a future
 * extraction of the shared client lands cleanly.
 */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
  requestId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | undefined;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.error?.code ?? 'UNKNOWN';
    this.details = body.error?.details;
    this.requestId = body.requestId;
  }

  static is(value: unknown): value is ApiError {
    return value instanceof ApiError;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed');
    this.name = 'NetworkError';
    (this as Error & { cause?: unknown }).cause = cause;
  }
}
