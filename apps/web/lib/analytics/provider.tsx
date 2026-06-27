'use client';

import * as React from 'react';
import type { AnalyticsEventMap, AnalyticsEventName } from './events';
import { consoleSink, type AnalyticsSink } from './sink';

interface AnalyticsContextValue {
  track: <N extends AnalyticsEventName>(name: N, payload: AnalyticsEventMap[N]) => void;
  sessionId: string;
}

const AnalyticsContext = React.createContext<AnalyticsContextValue | null>(null);

function generateSessionId(): string {
  // Browser-only — provider mounts in a 'use client' tree.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function AnalyticsProvider({
  children,
  sinks = [consoleSink],
}: {
  children: React.ReactNode;
  sinks?: AnalyticsSink[];
}) {
  const sessionRef = React.useRef<string>();
  if (!sessionRef.current) sessionRef.current = generateSessionId();

  const value = React.useMemo<AnalyticsContextValue>(
    () => ({
      sessionId: sessionRef.current!,
      track: (name, payload) => {
        const envelope = {
          name,
          payload,
          ts: Date.now(),
          sessionId: sessionRef.current!,
        };
        for (const sink of sinks) {
          try {
            sink.capture(envelope);
          } catch {
            /* never let a sink failure break the page */
          }
        }
      },
    }),
    [sinks],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = React.useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used inside <AnalyticsProvider>');
  return ctx;
}

/** Convenience hook — fires a `page_view` event on mount per `path`. */
export function usePageView(path: string, title?: string) {
  const { track } = useAnalytics();
  React.useEffect(() => {
    track('page_view', { path, ...(title ? { title } : {}) });
  }, [track, path, title]);
}
