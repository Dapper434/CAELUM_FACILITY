import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs `fn` on mount / when deps change; optional polling interval in ms. */
export function useAsync(fn, deps = [], { interval } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    setLoading(true);
    run();
    if (!interval) return undefined;
    const t = setInterval(run, interval);
    return () => clearInterval(t);
  }, [run, interval]);

  return { data, error, loading, reload: run, setData };
}
