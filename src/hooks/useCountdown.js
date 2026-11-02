import { useEffect, useState } from 'react';
import { msUntil } from '../utils/format';

/** Live milliseconds remaining until `iso`, ticking every second. */
export function useCountdown(iso) {
  const [ms, setMs] = useState(() => msUntil(iso));
  useEffect(() => {
    setMs(msUntil(iso));
    if (!iso) return undefined;
    const t = setInterval(() => setMs(msUntil(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);
  return ms;
}
