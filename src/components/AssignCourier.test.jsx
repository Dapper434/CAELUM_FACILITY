import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../api/transfers', () => ({ transfersApi: { qr: vi.fn(), courierSuggestions: vi.fn(), assignCourier: vi.fn() } }));
import { transfersApi } from '../api/transfers';
import DonorCustodyPanel, { AssignCourier, lastCourierMiss } from './DonorCustodyPanel';

const sugs = {
  suggestions: [
    { courier_id: 'c2', full_name: 'K. Kiprop', vehicle_type: 'boda', distance_km: 3.24, eta_minutes: 4, same_region: true, training_certified: true, location_source: 'gps' },
    { courier_id: 'c3', full_name: 'S. Chebet', vehicle_type: 'car', distance_km: 12, eta_minutes: 13, same_region: true, training_certified: true, location_source: 'home_facility' },
  ],
};
const timedOut = { id: 't1', stage: 'packed', seal_number: 'S', courier_timed_out_at: '2026-11-05T00:00:00Z',
  courier_attempts: [{ courier_id: 'c1', outcome: 'timed_out', at: '2026-11-05T00:00:00Z' }] };

describe('AssignCourier', () => {
  beforeEach(() => { vi.clearAllMocks(); transfersApi.courierSuggestions.mockResolvedValue(sugs); });

  it('after a timeout shows the banner, the top courier as primary and the rest', async () => {
    const onDone = vi.fn();
    transfersApi.assignCourier.mockResolvedValue({ stage: 'courier_assigned' });
    render(<AssignCourier transfer={timedOut} onDone={onDone} />);
    expect(await screen.findByTestId('courier-miss')).toHaveTextContent('did not accept in time');
    const primary = screen.getByText('Reassign to K. Kiprop (3.2 km, ~4 min, free)');
    expect(screen.getByTestId('courier-list')).toHaveTextContent('S. Chebet');
    fireEvent.click(primary);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(transfersApi.assignCourier).toHaveBeenCalledWith('t1', 'c2');
  });

  it('explains a decline with its reason', async () => {
    render(<AssignCourier transfer={{ id: 't1', stage: 'packed', courier_attempts: [{ courier_id: 'c1', outcome: 'declined', reason_code: 'too_far' }] }} onDone={() => {}} />);
    expect(await screen.findByTestId('courier-miss')).toHaveTextContent('declined this job (Too far)');
  });

  it('first assignment has no banner', async () => {
    render(<AssignCourier transfer={{ id: 't1', stage: 'packed' }} onDone={() => {}} />);
    expect(await screen.findByText('Assign K. Kiprop (3.2 km, ~4 min, free)')).toBeInTheDocument();
    expect(screen.queryByTestId('courier-miss')).toBeNull();
    expect(lastCourierMiss({})).toBeNull();
  });
});

describe('DonorCustodyPanel countdown', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); transfersApi.qr.mockResolvedValue({ qr_payload: 'x', seal_number: 'S', expires_at: '2099-01-01T00:00:00Z' }); });
  afterEach(() => vi.useRealTimers());

  it('refetches as soon as the accept timer hits zero', async () => {
    const onChange = vi.fn();
    const deadline = new Date(Date.now() + 2000).toISOString();
    render(<DonorCustodyPanel transfer={{ id: 't1', stage: 'courier_assigned', seal_number: 'S', courier_accept_deadline: deadline }} onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(3000); });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });
});
