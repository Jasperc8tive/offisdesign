'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { reportError } from '../../lib/observability/error-reporter';

/**
 * Wires Next.js's web-vitals callback to the same vendor-neutral reporter
 * we use for errors. When Sentry / Datadog / a custom analytics endpoint is
 * configured, switch the body of `track` to emit there; call sites stay put.
 *
 * Today: logs CLS / LCP / INP / FCP / TTFB / FID to console at info level,
 * elevates to warn when over the "needs improvement" threshold.
 */

const THRESHOLDS: Record<string, number> = {
  CLS: 0.1,
  LCP: 2500,
  INP: 200,
  FCP: 1800,
  TTFB: 800,
  FID: 100,
};

export function WebVitals() {
  useReportWebVitals((metric) => {
    const threshold = THRESHOLDS[metric.name];
    const degraded = threshold !== undefined && metric.value > threshold;
    const payload = {
      name: metric.name,
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
    };
    if (degraded) {
      reportError(new Error(`web-vital degraded: ${metric.name}=${payload.value}`), {
        tags: { kind: 'web-vital', name: metric.name },
        extra: payload,
      });
    } else {
      // `info` would be cleaner but web's lint preset only permits warn/error.
      console.warn('[web-vital]', payload);
    }
  });
  return null;
}
