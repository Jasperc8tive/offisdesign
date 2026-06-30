'use client';

import { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds of delay before the transition runs — handy for light staggering. */
  delay?: number;
  /** Travel distance in px for the upward fade. */
  y?: number;
}

/**
 * Restrained scroll reveal: a gentle fade + rise the first time an element
 * enters the viewport. Implemented with IntersectionObserver + a CSS transition
 * (no animation library) so it adds nothing to the bundle — important because
 * reveals are sprinkled across content pages.
 *
 * SSR-safe: renders fully visible on the server and on the first client paint,
 * then "arms" the hidden state only after mount. Since every Reveal sits below
 * the fold, arming happens off-screen, so there's no flash — and with JS
 * disabled the content simply stays visible. `prefers-reduced-motion` skips the
 * effect entirely.
 */
export function Reveal({ children, className, delay = 0, y = 20 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const hidden = armed && !revealed;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.25, 0, 0, 1)',
        transitionDelay: `${delay}s`,
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translateY(${y}px)` : 'none',
      }}
    >
      {children}
    </div>
  );
}
