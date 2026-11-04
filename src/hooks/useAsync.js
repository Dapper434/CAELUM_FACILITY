import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs `fn` on mount / when deps change. With `interval` it polls, pausing while
 * the tab is hidden and refreshing once when it becomes visible again or the window regains focus.
 * No state updates after unmount.
 */
export function useAsync(fn, deps = [], { interval } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  const mounted = useRef(true);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const result = await fnRef.current();
      if (!mounted.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    run();
    return () => { mounted.current = false; };
  }, [run]);

  // Separate from the fetch above so a changing interval (start/stop polling) does not refetch or flash loading.
  useEffect(() => {
    let timer = null;
    const start = () => { if (interval && !timer) timer = setInterval(run, interval); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onFocus = () => { if (!document.hidden) run(); };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { run(); start(); }
    };
    if (interval) {
      if (!document.hidden) start();
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('focus', onFocus);
    }
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [run, interval]);

  return { data, error, loading, reload: run, setData };
}
