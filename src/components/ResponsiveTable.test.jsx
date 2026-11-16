import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ResponsiveTable from './ResponsiveTable';
import { setMatchMedia } from '../test/setup';

const inventoryApi = vi.hoisted(() => ({ list: vi.fn(), setStatus: vi.fn(), correct: vi.fn() }));
vi.mock('../api/inventory', () => ({ inventoryApi }));
vi.mock('../hooks/useAsync', () => ({
  useAsync: () => ({
    data: [{
      id: 'u1', unit_code: 'KAP-ONEG-001', lot_number: 'LOT-9', blood_group: 'O-', product_type: 'packed_rbc',
      expiry_date: '2026-12-01T00:00:00Z', storage_temp_c: 4, status: 'available',
    }],
    error: null, loading: false, reload: vi.fn(),
  }),
}));
vi.mock('../hooks/useAction', () => ({
  useAction: () => ({ busy: false, error: null, run: async (fn) => { await fn(); return true; } }),
}));
import InventoryPage from '../pages/InventoryPage';

describe('ResponsiveTable', () => {
  it('mounts only the desktop table when the md breakpoint matches', () => {
    setMatchMedia(true);
    render(
      <ResponsiveTable
        rows={[{ id: '1', name: 'A' }]}
        columns={[{ header: 'Name', cell: (r) => r.name }]}
        card={(r) => <div data-testid="card">{r.name}</div>}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByTestId('card')).toBeNull();
    expect(screen.getAllByText('A')).toHaveLength(1);
  });

  it('mounts only the card list on small screens and switches when the breakpoint changes', () => {
    setMatchMedia(false);
    render(
      <ResponsiveTable
        rows={[{ id: '1', name: 'A' }]}
        columns={[{ header: 'Name', cell: (r) => r.name }]}
        card={(r) => <div data-testid="card">{r.name}</div>}
      />,
    );
    expect(screen.getByTestId('card')).toHaveTextContent('A');
    expect(screen.queryByRole('table')).toBeNull();
    act(() => setMatchMedia(true));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByTestId('card')).toBeNull();
  });
});

describe('Inventory mobile cards', () => {
  it('shows unit actions on the card (status select and Correct)', () => {
    setMatchMedia(false);
    inventoryApi.list.mockResolvedValue([]);
    render(<MemoryRouter><InventoryPage /></MemoryRouter>);
    expect(screen.getByTestId('unit-card')).toBeInTheDocument();
    expect(screen.getByLabelText('Status for KAP-ONEG-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Correct' })).toBeInTheDocument();
  });
});
