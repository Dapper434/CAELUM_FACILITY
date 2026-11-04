import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { isSlow, SLOW_MS, trackSlow } from './slow';
import { createHttpClient } from './http';
import { WakeHint } from '../components/ui';

describe('wake-up hint', () => {
  afterEach(() => vi.useRealTimers());

  it('flags calls slower than 5 s and clears when they resolve', async () => {
    vi.useFakeTimers();
    let finish;
    const p = new Promise((r) => { finish = r; });
    trackSlow(p);
    render(<WakeHint />);
    act(() => { vi.advanceTimersByTime(SLOW_MS - 1); });
    expect(screen.queryByText(/Waking up the server/)).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText(/Waking up the server/)).toBeInTheDocument();
    await act(async () => { finish(); await p; });
    expect(screen.queryByText(/Waking up the server/)).toBeNull();
    expect(isSlow()).toBe(false);
  });

  it('never shows for fast calls, and clears after failures', async () => {
    vi.useFakeTimers();
    await trackSlow(Promise.resolve(1));
    act(() => { vi.advanceTimersByTime(SLOW_MS * 2); });
    expect(isSlow()).toBe(false);
    let fail;
    const p = new Promise((_, rej) => { fail = rej; });
    trackSlow(p).catch(() => {});
    act(() => { vi.advanceTimersByTime(SLOW_MS); });
    expect(isSlow()).toBe(true);
    await act(async () => { fail(new Error('x')); await p.catch(() => {}); });
    expect(isSlow()).toBe(false);
  });

  it('tracks API calls made through the http client', async () => {
    vi.useFakeTimers();
    let respond;
    const fetchImpl = vi.fn(() => new Promise((r) => { respond = r; }));
    const http = createHttpClient({ baseUrl: 'x', fetchImpl });
    const call = http.get('/me');
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(SLOW_MS); });
    expect(isSlow()).toBe(true);
    await act(async () => { respond({ ok: true, status: 200, text: async () => '{"data":{}}' }); await call; });
    expect(isSlow()).toBe(false);
  });
});
