import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

const requestsApi = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  candidates: vi.fn(),
  sendOffer: vi.fn(),
  cancel: vi.fn(),
}));
const offersApi = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), hold: vi.fn(), accept: vi.fn(), decline: vi.fn() }));
const transfersApi = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  tracking: vi.fn(async () => null),
  temperature: vi.fn(async () => []),
  custody: vi.fn(async () => []),
  audit: vi.fn(async () => []),
  cancel: vi.fn(),
}));
const inventoryApi = vi.hoisted(() => ({ list: vi.fn(), setStatus: vi.fn(), correct: vi.fn() }));

vi.mock('../api/requests', () => ({ requestsApi }));
vi.mock('../api/offers', () => ({ offersApi }));
vi.mock('../api/transfers', () => ({ transfersApi }));
vi.mock('../api/inventory', () => ({ inventoryApi }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ facilityId: 'f1' }) }));
vi.mock('../components/TrackingMap', () => ({ default: () => <div data-testid="map" /> }));

import RequestsPage from './RequestsPage';
import RequestDetailPage from './RequestDetailPage';
import TransfersPage from './TransfersPage';
import TransferDetailPage from './TransferDetailPage';
import OffersPage, { OfferDetailPage } from './OffersPage';
import InventoryPage, { InventoryUnitPage } from './InventoryPage';

const request = {
  id: 'r1', request_code: 'REQ-1', recipient_facility_id: 'f1', units_requested: 2, blood_group: 'O-', product_type: 'packed_rbc',
  status: 'open', urgency: 'routine', created_at: '2026-11-01T00:00:00Z', needed_by: null, reason: '',
};
const transfer = {
  id: 't1', transfer_code: 'TRF-1', manifest_code: 'MAN-1', quantity: 1, blood_group: 'O-', product_type: 'packed_rbc',
  stage: 'packed', stage_history: [], donor_facility_id: 'f1', recipient_facility_id: 'f2', units: [],
  updated_at: '2026-11-01T00:00:00Z',
};
const offer = {
  id: 'o1', offer_code: 'OFR-1', status: 'pending', units_requested: 2, blood_group: 'O-', product_type: 'packed_rbc',
  distance_km: 8, eta_minutes: 40, eta_source: 'estimate',
};
const unit = {
  id: 'u1', unit_code: 'U-1', lot_number: 'L1', blood_group: 'O-', product_type: 'packed_rbc',
  expiry_date: '2026-12-01T00:00:00Z', storage_temp_c: 4, status: 'available',
};

function paged(items) {
  return { items, page: 1, page_size: 25, total: items.length, has_more: false };
}

function show(ui, path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>{ui}</Routes>
    </MemoryRouter>,
  );
}

const requestRoutes = (
  <Route path="requests" element={<RequestsPage />}>
    <Route path=":id" element={<RequestDetailPage />} />
  </Route>
);

describe('request detail back navigation', () => {
  beforeEach(() => {
    requestsApi.list.mockReset();
    requestsApi.get.mockReset();
    requestsApi.candidates.mockReset();
    offersApi.list.mockReset().mockResolvedValue([]);
    requestsApi.list.mockResolvedValue(paged([request]));
    requestsApi.get.mockResolvedValue(request);
    requestsApi.candidates.mockResolvedValue({ candidates: [{ donor_facility_id: 'd1', rank: 1, donor_name: 'Moi', donor_level_label: 'L6', elapsed_minutes: 20, eta_source: 'estimate', distance_km: 12, road_minutes: 15, handling_minutes: 5, current_stock: 8, post_transfer_units: 6, post_transfer_cover_days: 4, earliest_expiry: '2026-12-01T00:00:00Z', cold_chain_viable: true }] });
  });

  it('shows Back to requests in the panel, and Esc returns to the list with filters and selection kept', async () => {
    show(requestRoutes, '/requests?status=open');
    expect(await screen.findByText('REQ-1')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toHaveValue('open');
    fireEvent.click(screen.getByRole('link', { name: 'REQ-1' }));
    expect(await screen.findByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
    expect(screen.getByText('Ranked candidate donors')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'REQ-1' }).closest('[data-selected="true"]') || screen.getByRole('link', { name: 'REQ-1' }).closest('tr')).toHaveAttribute('data-selected', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Ranked candidate donors')).toBeNull());
    expect(screen.getByLabelText('Status')).toHaveValue('open');
    expect(screen.getByRole('link', { name: 'REQ-1' }).closest('[data-selected="true"], tr[data-selected="true"]')).toBeTruthy();
  });

  it('does not close the detail when Esc is pressed in an input, or while a dialog is open', async () => {
    show(requestRoutes, '/requests/r1');
    expect(await screen.findByRole('link', { name: 'Back to requests' })).toBeInTheDocument();

    const field = document.createElement('input');
    document.body.appendChild(field);
    field.focus();
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(screen.getByText('Ranked candidate donors')).toBeInTheDocument();
    field.remove();

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByText('Ranked candidate donors')).toBeInTheDocument();
    dialog.remove();
  });

  it('puts a back button on the no eligible candidates empty state', async () => {
    requestsApi.candidates.mockResolvedValue({ candidates: [] });
    show(requestRoutes, '/requests/r1');
    expect(await screen.findByText('No eligible donors in region')).toBeInTheDocument();
    const backs = screen.getAllByRole('link', { name: 'Back to requests' });
    expect(backs.length).toBeGreaterThan(1);
    fireEvent.click(backs[backs.length - 1]);
    await waitFor(() => expect(screen.queryByText('No eligible donors in region')).toBeNull());
    expect(await screen.findByText('REQ-1')).toBeInTheDocument();
  });

  it('puts a back button on a missing request', async () => {
    requestsApi.get.mockResolvedValue(null);
    show(requestRoutes, '/requests/missing');
    expect(await screen.findByText(/Request not found|not found/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('link', { name: 'Back to requests' })[0]);
    expect(await screen.findByText('REQ-1')).toBeInTheDocument();
  });
});

describe('transfers, offers and inventory details', () => {
  beforeEach(() => {
    transfersApi.list.mockReset().mockResolvedValue(paged([transfer]));
    transfersApi.get.mockReset().mockResolvedValue(transfer);
    offersApi.list.mockReset().mockResolvedValue([offer]);
    offersApi.get.mockReset().mockResolvedValue(offer);
    inventoryApi.list.mockReset().mockResolvedValue(paged([unit]));
  });

  it('returns from a transfer to the filtered list', async () => {
    transfersApi.list.mockImplementation(async (params) => paged(params.active === 'true' ? [transfer] : [transfer]));
    show(
      <Route path="transfers" element={<TransfersPage />}>
        <Route path=":id" element={<TransferDetailPage />} />
      </Route>,
      '/transfers?active=true',
    );
    fireEvent.click(await screen.findByRole('link', { name: 'TRF-1' }));
    expect(await screen.findByRole('link', { name: 'Back to transfers' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to transfers' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Back to transfers' })).toBeNull());
    expect(screen.getByLabelText('Active only')).toBeChecked();
    expect(screen.getByRole('link', { name: 'TRF-1' })).toBeInTheDocument();
  });

  it('opens an offer detail and goes back, keeping the outgoing filter', async () => {
    show(
      <Route path="offers" element={<OffersPage />}>
        <Route path=":id" element={<OfferDetailPage />} />
      </Route>,
      '/offers?direction=outgoing',
    );
    expect(await screen.findByText('OFR-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /OFR-1/ }));
    expect(await screen.findByRole('link', { name: 'Back to donor offers' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Details' })).toHaveTextContent('OFR-1');
    fireEvent.click(screen.getByRole('link', { name: 'Back to donor offers' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Back to donor offers' })).toBeNull());
    expect(screen.getByRole('button', { name: /Outgoing/ })).toHaveClass('bg-brand-cobalt');
  });

  it('opens a unit from inventory and keeps the status filter on the way back', async () => {
    show(
      <Route path="inventory" element={<InventoryPage />}>
        <Route path=":id" element={<InventoryUnitPage />} />
      </Route>,
      '/inventory?status=available',
    );
    fireEvent.click(await screen.findByRole('link', { name: 'U-1' }));
    expect(await screen.findByRole('link', { name: 'Back to inventory' })).toBeInTheDocument();
    expect(screen.getByText('U-1', { selector: 'h1' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to inventory' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'U-1' })).toBeNull());
    expect(screen.getByLabelText('Status')).toHaveValue('available');
    expect(screen.getByRole('link', { name: 'U-1' })).toBeInTheDocument();
  });
});
