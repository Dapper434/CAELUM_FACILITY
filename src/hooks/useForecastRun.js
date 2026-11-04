import { useEffect, useRef, useState } from 'react';
import { forecastApi } from '../api/forecast';
import { useAsync } from './useAsync';

export const RUN_POLL_MS = 3000;
const KEY = 'caelum.forecastRun';
const ACTIVE = ['queued', 'running'];
const count = (v) => (Array.isArray(v) ? v.length : Number(v) || 0);

/** Job id from a ForecastRun, tolerating {id} or a nested {job} shape. */
export function jobIdOf(run) {
  const j = run?.job ?? run;
  const id = j?.job_id ?? j?.id;
  return id ? String(id) : null;
}

/** Counts for the completion message; missing fields count as 0. */
export function runSummary(result) {
  const r = result || {};
  return { facilities: count(r.facilities), series: count(r.series), shortages: count(r.shortages), alerts: count(r.alerts), suggested: count(r.suggested_requests) };
}

export function summaryText(s) {
  return `Forecast finished: ${s.facilities} facilities, ${s.series} series, ${s.shortages} shortages, ${s.alerts} alerts, ${s.suggested} suggested requests.`;
}

const savedId = () => { const v = sessionStorage.getItem(KEY); return v && v !== 'undefined' && v !== 'null' ? v : null; };

/** Starts or resumes a forecast run job and polls it until it finishes. */
export function useForecastRun({ onSucceeded } = {}) {
  const [jobId, setJobId] = useState(savedId);
  const [summary, setSummary] = useState(null);
  const [started, setStarted] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [starting, setStarting] = useState(false);
  const handled = useRef(null);
  const onSucceededRef = useRef(onSucceeded);
  onSucceededRef.current = onSucceeded;

  const poll = useAsync(() => (jobId ? forecastApi.getRun(jobId) : Promise.resolve(null)), [jobId], {
    interval: jobId ? RUN_POLL_MS : undefined,
  });
  const polled = poll.data?.job ?? poll.data;
  const job = jobId && jobIdOf(polled) === jobId ? polled : jobId && jobIdOf(started) === jobId ? started : null;
  const active = Boolean(jobId) && (!job || ACTIVE.includes(job.status));

  const finish = () => { sessionStorage.removeItem(KEY); setJobId(null); };

  useEffect(() => {
    const id = jobIdOf(job);
    if (!job || handled.current === id) return;
    if (job.status === 'succeeded') {
      handled.current = id;
      finish();
      setSummary(runSummary(job.result));
      // 1.4.1: per-facility failures inside a successful run; null/missing means none.
      setWarnings(Array.isArray(job.result?.errors) ? job.result.errors : []);
      onSucceededRef.current?.(job);
    } else if (job.status === 'failed') {
      handled.current = id;
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
    setWarnings([]);
    setSummary(null);
    setStarting(true);
    try {
      const res = await forecastApi.run(); // 202 new job or 200 existing queued/running job
      const run = res?.job ?? res;
      const id = jobIdOf(run);
      if (!id) throw new Error('The server did not return a forecast job id.');
      handled.current = null;
      sessionStorage.setItem(KEY, id);
      setStarted(run);
      setJobId(id);
    } catch (err) {
      setError(err);
    } finally {
      setStarting(false);
    }
  }

  const finished = job && !ACTIVE.includes(job.status);
  return { start, job: finished ? null : job, active: active || starting, error, warnings, summary, lastResult: finished ? job : null };
}

export function runLabel(job, active) {
  if (!active) return 'Run forecast';
  const p = job?.progress;
  if (job?.status === 'running' && p?.facilities_total) return `Running… ${p.facilities_done}/${p.facilities_total} facilities`;
  return job?.status === 'running' ? 'Running…' : 'Queued…';
}
