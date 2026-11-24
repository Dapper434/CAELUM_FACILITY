import { useEffect, useRef, useState } from 'react';

function reducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates an integer from its previous value to `value` in about 600ms.
 * The first load counts up from zero; later polls only animate when the number changes.
 */
export function useCountUp(value, { duration = 600 } = {}) {
  const target = Number.isFinite(Number(value)) ? Number(value) : null;
  const [display, setDisplay] = useState(target == null ? null : (reducedMotion() ? target : 0));
  const shown = useRef(display);
  const frame = useRef(null);

  useEffect(() => {
    if (target == null) {
      shown.current = null;
      setDisplay(null);
      return undefined;
    }
    if (reducedMotion()) {
      shown.current = target;
      setDisplay(target);
      return undefined;
    }

    const from = shown.current == null ? 0 : shown.current;
    if (from === target) {
      setDisplay(target);
      return undefined;
    }

    const started = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      const next = Math.round(from + ((target - from) * eased));
      shown.current = next;
      setDisplay(next);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return display;
}
