import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../api/transfers', () => ({ transfersApi: { qr: vi.fn() } }));
vi.mock('../api/couriers', () => ({ couriersApi: { list: vi.fn().mockResolvedValue([]) } }));
import { transfersApi } from '../api/transfers';
import { QrDisplay } from './DonorCustodyPanel';

const first = { qr_payload: 'caelum:v1:t1:SEAL-1:1:aaa', seal_number: 'SEAL-1', expires_at: '2026-11-03T08:00:00Z', expired: true, reissued: false };
const fresh = { qr_payload: 'caelum:v1:t1:SEAL-1:2:bbb', seal_number: 'SEAL-1', expires_at: '2099-11-03T12:00:00Z', expired: false, reissued: true };

describe('QrDisplay', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows expiry and regenerates with refresh=true', async () => {
    transfersApi.qr.mockResolvedValueOnce(first).mockResolvedValueOnce(fresh);
    render(<QrDisplay transfer={{ id: 't1', stage: 'packed', seal_number: 'SEAL-1' }} />);
    expect(await screen.findByTestId('qr-expiry')).toHaveTextContent('Expired 03 Nov, 11:00 EAT');
    fireEvent.click(screen.getByText('Regenerate QR'));
    await waitFor(() => expect(screen.getByTestId('qr-expiry')).toHaveTextContent('Valid until'));
    expect(transfersApi.qr).toHaveBeenLastCalledWith('t1', { refresh: true });
    expect(screen.getByText('reissued')).toBeInTheDocument();
  });

  it('hides Regenerate outside packed/courier_assigned', async () => {
    transfersApi.qr.mockResolvedValue(fresh);
    render(<QrDisplay transfer={{ id: 't1', stage: 'in_transit', seal_number: 'SEAL-1' }} />);
    await screen.findByTestId('qr-expiry');
    expect(screen.queryByText('Regenerate QR')).toBeNull();
  });
});
