import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../api/transfers', () => ({ transfersApi: { sealCheck: vi.fn() } }));
import { transfersApi } from '../api/transfers';
import { SealCheck } from './RecipientCustodyPanel';

describe('SealCheck (server-side)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the entered seal and shows a match', async () => {
    transfersApi.sealCheck.mockResolvedValue({ match: true, checked_at: '2026-11-03T10:00:00Z' });
    const onChecked = vi.fn();
    render(<SealCheck transferId="t1" onChecked={onChecked} />);
    fireEvent.change(screen.getByLabelText(/Seal number/), { target: { value: ' SEAL-DEMO-0001 ' } });
    fireEvent.click(screen.getByText('Check seal'));
    expect(await screen.findByText('Matches')).toBeInTheDocument();
    expect(transfersApi.sealCheck).toHaveBeenCalledWith('t1', 'SEAL-DEMO-0001');
    expect(onChecked).toHaveBeenCalled();
  });

  it('shows a mismatch from the server', async () => {
    transfersApi.sealCheck.mockResolvedValue({ match: false, checked_at: '2026-11-03T10:00:00Z' });
    render(<SealCheck transferId="t1" />);
    fireEvent.change(screen.getByLabelText(/Seal number/), { target: { value: 'SEAL-9' } });
    fireEvent.click(screen.getByText('Check seal'));
    expect(await screen.findByText('Does not match')).toBeInTheDocument();
  });

  it('surfaces API errors such as wrong stage', async () => {
    transfersApi.sealCheck.mockRejectedValue(Object.assign(new Error('Not in transit'), { code: 'invalid_state' }));
    render(<SealCheck transferId="t1" />);
    fireEvent.change(screen.getByLabelText(/Seal number/), { target: { value: 'X' } });
    fireEvent.click(screen.getByText('Check seal'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('invalid_state'));
  });
});
