import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { courierStatusLabel, transferPollInterval, TRANSFER_POLL_MS } from './transferStatus';

const transfersApi = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../api/transfers', () => ({ transfersApi }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ facilityId: 'f1' }) }));
import TransfersPage from '../pages/TransfersPage';

const row = (stage, extra = {}) => ({ id: `t-${stage}`, transfer_code: `TRF-${stage}`, stage, donor_facility_id: 'f1', recipient_facility_id: 'f2', quantity: 1, blood_group: 'O-', ...extra });

describe('courier status label', () => {
  it('distinguishes accepted from merely assigned', () => {
    expect(courierStatusLabel(row('courier_assigned'))).toBe('Courier assigned – waiting for courier to accept');
    expect(courierStatusLabel(row('courier_assigned', { courier_accepted_at: '2026-11-05T07:05:00Z' }))).toBe('Courier accepted at 10:05 – awaiting pickup');
    expect(courierStatusLabel(row('courier_assigned', { job: { courier_accepted_at: '2026-11-05T07:05:00Z' } }))).toMatch(/^Courier accepted at 10:05/);
    expect(courierStatusLabel(row('in_transit', { courier_accepted_at: '2026-11-05T07:05:00Z' }))).toBeNull();
  });

  it('polls only while something is active', () => {
    expect(transferPollInterval(row('courier_assigned'))).toBe(TRANSFER_POLL_MS);
    expect(transferPollInterval([row('delivered'), row('cancelled')])).toBe(0);
    expect(transferPollInterval([row('delivered'), row('in_transit')])).toBe(TRANSFER_POLL_MS);
  });
});

describe('Transfers list polling', () => {
  beforeEach(() => { vi.useFakeTimers(); transfersApi.list.mockReset(); });
  afterEach(() => vi.useRealTimers());
  const flush = (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

  it('polls every 12 s while a row is active and stops once all are terminal', async () => {
    transfersApi.list.mockResolvedValue([row('courier_assigned', { courier_accepted_at: '2026-11-05T07:05:00Z' })]);
    render(<MemoryRouter><TransfersPage /></MemoryRouter>);
    await flush();
    expect(screen.getByText('Courier accepted at 10:05 – awaiting pickup')).toBeInTheDocument();
    const n = transfersApi.list.mock.calls.length;
    await flush(TRANSFER_POLL_MS);
    expect(transfersApi.list.mock.calls.length).toBeGreaterThan(n);
    transfersApi.list.mockResolvedValue([row('delivered')]);
    await flush(TRANSFER_POLL_MS);
    await flush();
    const done = transfersApi.list.mock.calls.length;
    await flush(TRANSFER_POLL_MS * 3);
    expect(transfersApi.list.mock.calls.length).toBe(done);
  });

  it('refetches on window focus', async () => {
    transfersApi.list.mockResolvedValue([row('packed')]);
    render(<MemoryRouter><TransfersPage /></MemoryRouter>);
    await flush();
    const n = transfersApi.list.mock.calls.length;
    await act(async () => { window.dispatchEvent(new Event('focus')); await vi.advanceTimersByTimeAsync(0); });
    expect(transfersApi.list.mock.calls.length).toBe(n + 1);
  });
});
