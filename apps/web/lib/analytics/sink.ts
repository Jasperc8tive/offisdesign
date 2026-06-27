import type { AnalyticsEventMap, AnalyticsEventName } from './events';

export interface AnalyticsEnvelope<N extends AnalyticsEventName = AnalyticsEventName> {
  name: N;
  payload: AnalyticsEventMap[N];
  ts: number;
  sessionId: string;
}

export interface AnalyticsSink {
  readonly name: string;
  capture(envelope: AnalyticsEnvelope): void;
}

/**
 * Default sink — writes to the dev console. Plug a real provider (GA4,
 * Plausible, Posthog, Segment, an internal collector) by implementing the
 * same interface and binding it via `AnalyticsProvider`.
 */
export const consoleSink: AnalyticsSink = {
  name: 'console',
  capture(envelope) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', envelope.name, envelope.payload);
    }
  },
};
