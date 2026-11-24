import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    facilityId: 'f1',
    facility: { name: 'Kenyatta National Hospital', county: 'Nairobi', mfl_code: '90001' },
  }),
}));

const alert = (id, urgency, group) => ({
  id,
  blood_group: group,
  product_type: 'packed_rbc',
  urgency,
  units_remaining: 4,
  days_of_cover: 1.5,
  depletion_at: '2026-11-25T10:00:00Z',
  detected_at: '2026-11-24T08:00:00Z',
  updated_at: '2026-11-24T09:00:00Z',
});
const alerts = [alert('a1', 'critical', 'O-'), alert('a2', 'critical', 'A+'), alert('a3', 'urgent', 'B+')];
const suggestedRequest = {
  id: 'r1', request_code: 'REQ-1', blood_group: 'O-', product_type: 'packed_rbc', units_requested: 2,
};
const offer = {
  id: 'o1', offer_code: 'OFR-1', status: 'held', blood_group: 'O-', units_requested: 2,
  expires_at: '2026-11-24T15:00:00Z',
};
const transfer = {
  id: 't1', transfer_code: 'TRF-1', quantity: 2, blood_group: 'O-', product_type: 'packed_rbc',
  stage: 'in_transit', donor_facility_id: 'f1', recipient_facility_id: 'f2',
  created_at: '2026-11-24T08:00:00Z', updated_at: '2026-11-24T09:00:00Z',
};
const counts = {
  available: 8, reserved: 2, in_transit: 1, quarantined: 1, transferred: 1, expired: 0, discarded: 0,
};

vi.mock('../api/forecast', () => ({ forecastApi: { alerts: vi.fn(async () => alerts) } }));
vi.mock('../api/offers', () => ({ offersApi: { list: vi.fn(async () => [offer]) } }));
vi.mock('../api/requests', () => ({
  requestsApi: {
    list: vi.fn(async (status) => (status === 'suggested' ? [suggestedRequest] : [])),
  },
}));
vi.mock('../api/transfers', () => ({
  transfersApi: { list: vi.fn(async () => ({ items: [transfer], total: 1, page: 1, page_size: 5 })) },
}));
vi.mock('../api/inventory', () => ({
  inventoryApi: {
    list: vi.fn(async ({ status } = {}) => ({
      items: [], page: 1, page_size: 1,
      total: status ? counts[status] : Object.values(counts).reduce((sum, n) => sum + n, 0),
    })),
  },
}));
vi.mock('../api/facilities', () => ({
  facilitiesApi: {
    list: vi.fn(async () => [
      { id: 'f1', name: 'Kenyatta National Hospital' },
      { id: 'f2', name: 'Mbagathi Hospital' },
    ]),
    audit: vi.fn(async () => ({
      data: [{
        seq: 3, at: '2026-11-24T09:00:00Z', action: 'inventory.added', entity_type: 'facility',
        entity_id: 'f1', actor_role: 'facility',
      }],
      meta: {},
    })),
  },
}));

import DashboardPage from './DashboardPage';

function show() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

describe('dashboard enhancements', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows contextual KPIs and the cross-workflow attention panel', async () => {
    show();
    const openAlerts = await screen.findByRole('link', { name: /Open alerts/i });
    expect(within(openAlerts).getByText('3')).toBeInTheDocument();
    expect(within(openAlerts).getByText('2 critical · 1 warning')).toBeInTheDocument();
    expect(await screen.findByText('Your attention today')).toBeInTheDocument();
    expect(screen.getAllByText('Critical shortage').length).toBeGreaterThan(0);
    expect(screen.getByText('Held offer')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: /Offers to answer/i })).getByText('1 held')).toBeInTheDocument();
  });

  it('offers direct review actions and section jumps', async () => {
    show();
    const review = await screen.findByRole('link', { name: /^Review O- · Packed RBC in forecast and alerts$/ });
    expect(review).toHaveAttribute('href', '/forecast');

    const jump = screen.getByRole('navigation', { name: /jump to dashboard sections/i });
    expect(within(jump).getByRole('link', { name: 'Inventory' })).toHaveAttribute('href', '#inventory-intelligence');
    expect(within(jump).getByRole('link', { name: 'Transfers' })).toHaveAttribute('href', '#active-transfers');
  });

  it('filters and expands shortage alerts', async () => {
    show();
    expect(await screen.findAllByRole('button', { name: /units on hand/i })).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: /^Critical 2$/ }));
    expect(screen.getAllByRole('button', { name: /units on hand/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /B\+ · Packed RBC/i })).toBeNull();

    expect(screen.queryByRole('region', { name: /O- · Packed RBC/i })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /units on hand/i })[0]);
    const detail = screen.getByRole('region', { name: /O- · Packed RBC/i });
    expect(detail).toBeInTheDocument();
    expect(within(detail).getByText('Estimated depletion')).toBeInTheDocument();
  });

  it('links inventory statuses to filtered records and confirms reconciliation', async () => {
    show();
    expect(await screen.findByText('All tracked units are accounted for.')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /Available: 8 units/i });
    expect(links.some((link) => link.getAttribute('href') === '/inventory?status=available')).toBe(true);
  });

  it('shows origin, destination and a stage timeline for active transfers', async () => {
    show();
    expect((await screen.findAllByText('Kenyatta National Hospital')).length).toBeGreaterThan(0);
    expect(screen.getByText('Mbagathi Hospital')).toBeInTheDocument();
    expect(screen.getByText(/Started/)).toBeInTheDocument();
    expect(screen.getByText(/Stage 4 of 6/)).toBeInTheDocument();
  });
});
