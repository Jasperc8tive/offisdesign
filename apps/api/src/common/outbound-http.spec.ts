import { OutboundTimeoutError, withRetry, withTimeout } from './outbound-http';

describe('withTimeout', () => {
  it('resolves when the promise settles before the deadline', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 100)).resolves.toBe('ok');
  });

  it('rejects with OutboundTimeoutError when the deadline elapses first', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 100));
    await expect(withTimeout(slow, 10)).rejects.toBeInstanceOf(OutboundTimeoutError);
  });
});

describe('withRetry', () => {
  it('returns the first successful result', async () => {
    const fn = jest.fn().mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { attempts: 3, delayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure up to `attempts` times', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { attempts: 3, delayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops immediately when shouldRetry returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fatal'));
    await expect(
      withRetry(fn, { attempts: 5, delayMs: 1, shouldRetry: () => false }),
    ).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
