import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __resetErrorReporterForTests,
  installErrorReporter,
  reportError,
  reportMessage,
  setUser,
  type ErrorReporter,
} from './error-reporter';
import { ApiError } from '../api/errors';

afterEach(() => {
  __resetErrorReporterForTests();
});

function createSpyReporter(): ErrorReporter & {
  reportError: ReturnType<typeof vi.fn>;
  reportMessage: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
} {
  return {
    reportError: vi.fn(),
    reportMessage: vi.fn(),
    setUser: vi.fn(),
  };
}

describe('error reporter', () => {
  it('dispatches errors to the installed reporter', () => {
    const sink = createSpyReporter();
    installErrorReporter(sink);
    const err = new Error('boom');
    reportError(err, { tags: { feature: 'checkout' } });
    expect(sink.reportError).toHaveBeenCalledWith(err, { tags: { feature: 'checkout' } });
  });

  it('propagates the ApiError requestId via the reporter', () => {
    const sink = createSpyReporter();
    installErrorReporter(sink);
    const apiErr = new ApiError(500, {
      error: { code: 'INTERNAL', message: 'oops' },
      requestId: 'req-123',
    });
    reportError(apiErr);
    expect(sink.reportError).toHaveBeenCalledWith(apiErr, undefined);
    expect(apiErr.requestId).toBe('req-123');
  });

  it('swallows reporter exceptions so telemetry never crashes the app', () => {
    installErrorReporter({
      reportError: () => {
        throw new Error('vendor down');
      },
      reportMessage: () => {
        throw new Error('vendor down');
      },
      setUser: () => {
        throw new Error('vendor down');
      },
    });
    expect(() => reportError(new Error('x'))).not.toThrow();
    expect(() => reportMessage('hi')).not.toThrow();
    expect(() => setUser(null)).not.toThrow();
  });
});
