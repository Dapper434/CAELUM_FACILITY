import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ApiError } from '../lib/http';

const forecastApi = vi.hoisted(() => ({ get: vi.fn(), history: vi.fn(), run: vi.fn(), getRun: vi.fn(), alerts: vi.fn() }));
const requestsApi = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../api/forecast', () => ({ forecastApi }));
vi.mock('../api/requests', () => ({ requestsApi }));
import ForecastPage from '../pages/ForecastPage';
import { RUN_POLL_MS } from './useForecastRun';

const job = (status, extra = {}) => ({ job_id: 'j1', status, scope: 'f1', facility_id: 'f1', progress: { facilities_done: 2, facilities_total: 4 }, result: null, error: null, ...extra });
const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0); });
const tick = () => act(async () => { await vi.advanceTimersByTimeAsync(RUN_POLL_MS); });
const runButton = () => screen.getAllByRole('button').find((b) => /Run forecast|Running|Queued/.test(b.textContent));

describe('Run forecast job', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    Object.values(forecastApi).forEach((f) => f.mockReset());
    forecastApi.get.mockResolvedValue(null);
    forecastApi.history.mockResolvedValue(null);
    forecastApi.alerts.mockResolvedValue([]);
    requestsApi.list.mockReset().mockResolvedValue([]);
  });
  afterEach(() => vi.useRealTimers());

  async function startWith(runResponse) {
    forecastApi.run.mockResolvedValue(runResponse);
    const view = render(<MemoryRouter><ForecastPage /></MemoryRouter>);
    await flush();
    fireEvent.click(runButton());
    await flush();
    return view;
  }

  it.each([['202 queued', job('queued')], ['200 already running', job('running')]])('%s starts polling', async (_n, r) => {
    forecastApi.getRun.mockResolvedValue(job('running'));
    await startWith(r);
    const calls = forecastApi.getRun.mock.calls.length;
    expect(calls).toBeGreaterThanOrEqual(1);
    await tick();
    expect(forecastApi.getRun.mock.calls.length).toBeGreaterThan(calls);
    expect(forecastApi.getRun).toHaveBeenCalledWith('j1');
  });

  it('keeps the button disabled while running and shows progress', async () => {
    forecastApi.getRun.mockResolvedValue(job('running'));
    await startWith(job('queued'));
    expect(runButton()).toBeDisabled();
    expect(runButton()).toHaveTextContent('Running… 2/4 facilities');
  });

  it('refreshes forecast, history, alerts and suggestions on success, then stops polling', async () => {
    forecastApi.getRun.mockResolvedValue(job('running'));
    await startWith(job('queued'));
    const before = { f: forecastApi.get.mock.calls.length, h: forecastApi.history.mock.calls.length, a: forecastApi.alerts.mock.calls.length, s: requestsApi.list.mock.calls.length };
    forecastApi.getRun.mockResolvedValue(job('succeeded', { result: { suggested_requests: [], alerts: [] } }));
    await tick();
    expect(forecastApi.get.mock.calls.length).toBeGreaterThan(before.f);
    expect(forecastApi.history.mock.calls.length).toBeGreaterThan(before.h);
    expect(forecastApi.alerts.mock.calls.length).toBeGreaterThan(before.a);
    expect(requestsApi.list.mock.calls.length).toBeGreaterThan(before.s);
    expect(runButton()).not.toBeDisabled();
    const calls = forecastApi.getRun.mock.calls.length;
    await tick(); await tick();
    expect(forecastApi.getRun.mock.calls.length).toBe(calls);
    expect(sessionStorage.getItem('caelum.forecastRun')).toBeNull();
  });

  it('shows the error of a failed run', async () => {
    forecastApi.getRun.mockResolvedValue(job('failed', { error: 'Worker crashed' }));
    await startWith(job('queued'));
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('Worker crashed');
    expect(runButton()).not.toBeDisabled();
  });

  it('stops with a clear message on 404', async () => {
    forecastApi.getRun.mockRejectedValue(new ApiError(404, 'not_found', 'Not found'));
    await startWith(job('queued'));
    await flush();
    expect(screen.getByRole('alert')).toHaveTextContent('no longer exists');
    const calls = forecastApi.getRun.mock.calls.length;
    await tick();
    expect(forecastApi.getRun.mock.calls.length).toBe(calls);
  });

  it('stops polling on unmount', async () => {
    forecastApi.getRun.mockResolvedValue(job('running'));
    const view = await startWith(job('queued'));
    view.unmount();
    const calls = forecastApi.getRun.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(RUN_POLL_MS * 3); });
    expect(forecastApi.getRun.mock.calls.length).toBe(calls);
  });

  it('resumes a job saved in sessionStorage', async () => {
    sessionStorage.setItem('caelum.forecastRun', 'j1');
    forecastApi.getRun.mockResolvedValue(job('running'));
    render(<MemoryRouter><ForecastPage /></MemoryRouter>);
    await flush();
    expect(forecastApi.getRun).toHaveBeenCalledWith('j1');
    expect(runButton()).toBeDisabled();
  });
});

describe('forecast query guard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.values(forecastApi).forEach((f) => f.mockReset());
    forecastApi.alerts.mockResolvedValue([]);
    forecastApi.history.mockResolvedValue(null);
    requestsApi.list.mockResolvedValue([]);
  });

  it('never calls /forecast without a blood group', async () => {
    forecastApi.get.mockResolvedValue(null);
    render(<MemoryRouter><ForecastPage /></MemoryRouter>);
    await act(async () => {});
    expect(forecastApi.get).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByLabelText('Blood group'), { target: { value: '' } });
    await act(async () => {});
    expect(forecastApi.get).toHaveBeenCalledTimes(1);
    expect(forecastApi.history).toHaveBeenCalledTimes(1);
  });

  it('shows error.message for a 400 validation_error', async () => {
    forecastApi.get.mockRejectedValue(new ApiError(400, 'validation_error', 'blood_group must be one of O-, O+, …'));
    render(<MemoryRouter><ForecastPage /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('blood_group must be one of O-, O+, …');
  });
});
