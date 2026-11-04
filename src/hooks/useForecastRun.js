import { useEffect, useRef, useState } from 'react';
import { forecastApi } from '../api/forecast';
import { useAsync } from './useAsync';

export const RUN_POLL_MS = 3000;
const KEY = 'caelum.forecastRun';
const ACTIVE = ['queued', 'running'];

/** Starts or resumes a forecast run job and polls it until it finishes. */
export function useForecastRun({ onSucceeded } = {}) {
  const [jobId, setJobId] = useState(() => sessionStorage.getItem(KEY));
  const [started, setStarted] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const handled = useRef(null);
  const onSucceededRef = useRef(onSucceeded);
  onSucceededRef.current = onSucceeded;

  const poll = useAsync(() => (jobId ? forecastApi.getRun(jobId) : Promise.resolve(null)), [jobId], {
    interval: jobId ? RUN_POLL_MS : undefined,
  });
  const job = poll.data?.job_id === jobId ? poll.data : started?.job_id === jobId ? started : null;
  const active = Boolean(jobId) && (!job || ACTIVE.includes(job.status));

  const finish = () => { sessionStorage.removeItem(KEY); setJobId(null); };

  useEffect(() => {
    if (!job || handled.current === job.job_id) return;
    if (job.status === 'succeeded') {
      handled.current = job.job_id;
      finish();
      onSucceededRef.current?.(job);
    } else if (job.status === 'failed') {
      handled.current = job.job_id;
      finish();
      setError(new Error(job.error || 'Forecast run failed.'));
    }
  }, [job]);

  useEffect(() => {
    const e = poll.error;
    if (jobId && e && (e.status === 403 || e.status === 404)) {
      finish();
      setError(new Error(e.status === 404 ? 'That forecast run no longer exists.' : 'You are not allowed to view that forecast run.'));
    }
  }, [poll.error, jobId]);

  async function start() {
    setError(null);
    setStarting(true);
    try {
      const run = await forecastApi.run();
      sessionStorage.setItem(KEY, run.job_id);
      setStarted(run);
      setJobId(run.job_id);
    } catch (err) {
      setError(err);
    } finally {
      setStarting(false);
    }
  }

  const finished = job && !ACTIVE.includes(job.status);
  return { start, job: finished ? null : job, active: active || starting, error, lastResult: finished ? job : null };
}

export function runLabel(job, active) {
  if (!active) return 'Run forecast';
  const p = job?.progress;
  if (job?.status === 'running' && p?.facilities_total) return `Running… ${p.facilities_done}/${p.facilities_total} facilities`;
  return job?.status === 'running' ? 'Running…' : 'Queued…';
}
