import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('passes calls through while closed', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    await expect(breaker.exec(async () => 'ok')).resolves.toBe('ok');
    expect(breaker.inspect().state).toBe('closed');
  });

  it('opens after the configured failure streak', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 });
    await expect(
      breaker.exec(async () => {
        throw new Error('1');
      }),
    ).rejects.toThrow('1');
    await expect(
      breaker.exec(async () => {
        throw new Error('2');
      }),
    ).rejects.toThrow('2');
    expect(breaker.inspect().state).toBe('open');
    await expect(breaker.exec(async () => 'ok')).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it('transitions to half-open after the cooldown and closes on success', async () => {
    let now = 1_000;
    const clock = (): number => now;
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 100 });
    await expect(
      breaker.exec(async () => {
        throw new Error('x');
      }, clock),
    ).rejects.toThrow('x');
    expect(breaker.inspect().state).toBe('open');
    now += 200; // cooldown elapsed
    await expect(breaker.exec(async () => 'recovered', clock)).resolves.toBe('recovered');
    expect(breaker.inspect().state).toBe('closed');
  });

  it('a failure in half-open re-opens immediately', async () => {
    let now = 0;
    const clock = (): number => now;
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 50 });
    await expect(
      breaker.exec(async () => {
        throw new Error('a');
      }, clock),
    ).rejects.toThrow();
    now = 100;
    await expect(
      breaker.exec(async () => {
        throw new Error('still down');
      }, clock),
    ).rejects.toThrow();
    expect(breaker.inspect().state).toBe('open');
  });
});
