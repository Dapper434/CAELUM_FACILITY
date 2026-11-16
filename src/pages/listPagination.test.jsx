import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const inventoryApi = vi.hoisted(() => ({ list: vi.fn(), setStatus: vi.fn(), correct: vi.fn() }));
const requestsApi = vi.hoisted(() => ({ list: vi.fn() }));
const transfersApi = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('../api/inventory', () => ({ inventoryApi }));
vi.mock('../api/requests', () => ({ requestsApi }));
vi.mock('../api/transfers', () => ({ transfersApi }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ facilityId: 'f1' }) }));

import InventoryPage from './InventoryPage';
import RequestsPage from './RequestsPage';
import TransfersPage from './TransfersPage';

const unit = (id) => ({
  id, unit_code: `U-${id}`, lot_number: 'L1', blood_group: 'O-', product_type: 'packed_rbc',
  expiry_date: '2026-12-01T00:00:00Z', storage_temp_c: 4, status: 'available',
});
const paged = (items, { page = 1, total, has_more, page_size = 25 } = {}) => ({
  items, page, page_size, total: total ?? items.length, has_more: Boolean(has_more),
});

describe('Inventory pagination', () => {
  beforeEach(() => { inventoryApi.list.mockReset(); });

  it('sends page and page_size, reads items/total/has_more, and offers page controls', async () => {
    inventoryApi.list.mockResolvedValue(paged([unit('a')], { page: 1, total: 60, has_more: true }));
    render(<MemoryRouter><InventoryPage /></MemoryRouter>);
    expect(await screen.findByText('U-a')).toBeInTheDocument();
    expect(inventoryApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 25 }));
    const sent = inventoryApi.list.mock.calls[0][0];
    expect(sent.page).not.toBe('');
    expect(sent.page).not.toBe(null);
    expect(screen.getByText('60 units')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    inventoryApi.list.mockResolvedValue(paged([unit('b')], { page: 2, total: 60, has_more: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('U-b')).toBeInTheDocument();
    expect(inventoryApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, page_size: 25 }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('resets to page 1 when a filter changes', async () => {
    inventoryApi.list.mockImplementation(async (params) => paged([unit(`p${params.page}`)], { page: params.page, total: 40, has_more: params.page < 2 }));
    render(<MemoryRouter><InventoryPage /></MemoryRouter>);
    await screen.findByText('U-p1');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('U-p2');
    fireEvent.change(screen.getByLabelText('Blood group'), { target: { value: 'A+' } });
    await waitFor(() => expect(inventoryApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, blood_group: 'A+' })));
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('falls back to a single page when the response is an unpaged array', async () => {
    inventoryApi.list.mockResolvedValue([unit('legacy')]);
    render(<MemoryRouter><InventoryPage /></MemoryRouter>);
    expect(await screen.findByText('U-legacy')).toBeInTheDocument();
    expect(screen.getByText('1 unit')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('clamps back to the last page when the requested page is past the end', async () => {
    let shrunk = false;
    inventoryApi.list.mockImplementation(async (params = {}) => {
      const page = params.page;
      // First two pages look like a 3-page list so Next stays enabled; page 3
      // then comes back empty with a smaller total (the list shrank).
      if (page >= 3) {
        shrunk = true;
        return paged([], { page, total: 26, has_more: false });
      }
      if (shrunk) return paged([unit(`p${page}`)], { page, total: 26, has_more: false });
      return paged([unit(`p${page}`)], { page, total: 60, has_more: true });
    });
    render(<MemoryRouter><InventoryPage /></MemoryRouter>);
    await screen.findByText('U-p1');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('U-p2');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(inventoryApi.list.mock.calls.some((c) => c[0].page === 3)).toBe(true));
    await waitFor(() => expect(inventoryApi.list.mock.calls.at(-1)[0].page).toBe(2));
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
  });
});

describe('Requests and transfers pagination', () => {
  beforeEach(() => {
    requestsApi.list.mockReset();
    transfersApi.list.mockReset();
  });

  it('pages requests and resets to page 1 when the status filter changes', async () => {
    requestsApi.list.mockImplementation(async (params) => paged(
      [{ id: `r${params.page}`, request_code: `REQ-${params.page}`, blood_group: 'O-', units_requested: 1, urgency: 'routine', status: 'open', created_at: '2026-11-01T00:00:00Z' }],
      { page: params.page, total: 40, has_more: params.page < 2 },
    ));
    render(<MemoryRouter><RequestsPage /></MemoryRouter>);
    expect(await screen.findByText('REQ-1')).toBeInTheDocument();
    expect(requestsApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, page_size: 25 }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('REQ-2');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'open' } });
    await waitFor(() => expect(requestsApi.list).toHaveBeenCalledWith(expect.objectContaining({ page: 1, status: 'open' })));
  });

  it('pages transfers, including active=true on the current page', async () => {
    transfersApi.list.mockResolvedValue(paged(
      [{ id: 't1', transfer_code: 'TRF-1', stage: 'packed', donor_facility_id: 'f1', recipient_facility_id: 'f2', quantity: 1, blood_group: 'O-', updated_at: '2026-11-01T00:00:00Z' }],
      { page: 1, total: 30, has_more: true },
    ));
    render(<MemoryRouter><TransfersPage /></MemoryRouter>);
    expect(await screen.findByText('TRF-1')).toBeInTheDocument();
    expect(transfersApi.list).toHaveBeenCalledWith(expect.objectContaining({ active: 'true', page: 1, page_size: 25 }));
    expect(screen.getByText('30 transfers')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
});
