import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { AnalyticsProvider, useAnalytics } from './provider';
import type { AnalyticsSink } from './sink';

function CaptureEvent({ onTrack }: { onTrack: () => void }) {
  const { track } = useAnalytics();
  React.useEffect(() => {
    onTrack();
    track('cta_click', { id: 'x', location: 'test' });
  }, [onTrack, track]);
  return null;
}

describe('AnalyticsProvider', () => {
  it('captures envelopes to every sink', () => {
    const captureA = vi.fn();
    const captureB = vi.fn();
    const sinkA: AnalyticsSink = { name: 'a', capture: captureA };
    const sinkB: AnalyticsSink = { name: 'b', capture: captureB };
    render(
      <AnalyticsProvider sinks={[sinkA, sinkB]}>
        <CaptureEvent onTrack={() => undefined} />
      </AnalyticsProvider>,
    );
    expect(captureA).toHaveBeenCalledOnce();
    expect(captureB).toHaveBeenCalledOnce();
    const envelope = captureA.mock.calls[0]![0] as {
      name: string;
      payload: { id: string; location: string };
      sessionId: string;
      ts: number;
    };
    expect(envelope.name).toBe('cta_click');
    expect(envelope.payload).toEqual({ id: 'x', location: 'test' });
    expect(envelope.sessionId).toBeTruthy();
    expect(typeof envelope.ts).toBe('number');
  });

  it('isolates one sink failing from the others', () => {
    const captureA = vi.fn(() => {
      throw new Error('boom');
    });
    const captureB = vi.fn();
    render(
      <AnalyticsProvider
        sinks={[
          { name: 'a', capture: captureA },
          { name: 'b', capture: captureB },
        ]}
      >
        <CaptureEvent onTrack={() => undefined} />
      </AnalyticsProvider>,
    );
    expect(captureB).toHaveBeenCalledOnce();
  });
});
