/**
 * Tiny circuit breaker.
 *
 * Wraps a callable. Tracks consecutive failures; after `failureThreshold`
 * trips, calls fail-fast for `cooldownMs`. After cooldown the breaker
 * enters a half-open state — the next call is allowed through; success
 * closes, failure re-opens.
 *
 * Use to protect outbound integrations (Stripe, mailer, tax provider).
 * The goal is to stop hammering an unhealthy dependency and free request
 * threads quickly so callers can degrade gracefully.
 *
 *   const stripeBreaker = new CircuitBreaker({ failureThreshold: 5 });
 *   const charge = await stripeBreaker.exec(() => stripe.charge(...));
 */

type State = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Failures in a row before the breaker trips open. Default 5. */
  failureThreshold: number;
  /** Ms to stay open before allowing a probe call. Default 30_000. */
  cooldownMs: number;
}

export class CircuitOpenError extends Error {
  constructor(readonly retryAfterMs: number) {
    super(`Circuit open; retry after ${retryAfterMs}ms`);
    this.name = 'CircuitOpenError';
  }
}

export class CircuitBreaker {
  private state: State = 'closed';
  private failures = 0;
  private openedAt = 0;
  private readonly opts: CircuitBreakerOptions;

  constructor(opts: Partial<CircuitBreakerOptions> = {}) {
    this.opts = {
      failureThreshold: opts.failureThreshold ?? 5,
      cooldownMs: opts.cooldownMs ?? 30_000,
    };
  }

  /**
   * Run `fn` through the breaker. Throws `CircuitOpenError` immediately
   * when the breaker is open and still inside its cooldown window.
   */
  async exec<T>(fn: () => Promise<T>, now: () => number = Date.now): Promise<T> {
    if (this.state === 'open') {
      const elapsed = now() - this.openedAt;
      if (elapsed < this.opts.cooldownMs) {
        throw new CircuitOpenError(this.opts.cooldownMs - elapsed);
      }
      // Cooldown elapsed — allow one probe.
      this.state = 'half-open';
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(now);
      throw err;
    }
  }

  private recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private recordFailure(now: () => number): void {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.opts.failureThreshold) {
      this.state = 'open';
      this.openedAt = now();
    }
  }

  /** Inspect current state. Useful for health endpoints and tests. */
  inspect(): { state: State; failures: number } {
    return { state: this.state, failures: this.failures };
  }
}
