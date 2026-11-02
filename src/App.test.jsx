import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const auth = { session: null, loading: false, me: null, facility: null, facilityId: null, error: null, signOut: vi.fn(), signIn: vi.fn(), configured: true, demoMode: false };
vi.mock('./context/AuthContext', () => ({ useAuth: () => auth, AuthProvider: ({ children }) => children }));
vi.mock('./components/TrackingMap', () => ({ default: () => <div data-testid="map" /> }));

const transfer = {
  id: 't1', transfer_code: 'TRF-TEST', manifest_code: 'MAN-1', quantity: 2, blood_group: 'O-', product_type: 'packed_rbc',
  stage: 'in_transit', stage_history: [], donor_facility_id: 'd', recipient_facility_id: 'f1', units: [],
};
const request = { id: 'r1', request_code: 'REQ-TEST', units_requested: 1, blood_group: 'O-', product_type: 'packed_rbc', status: 'matched', urgency: 'urgent' };
vi.mock('./api/transfers', () => ({ transfersApi: {
  get: vi.fn(async () => transfer), tracking: vi.fn(async () => null), temperature: vi.fn(async () => []),
  custody: vi.fn(async () => []), audit: vi.fn(async () => []), otp: vi.fn(async () => ({ otp_code: '123456' })), list: vi.fn(async () => []),
} }));
vi.mock('./api/requests', () => ({ requestsApi: { get: vi.fn(async () => request), candidates: vi.fn(async () => null), list: vi.fn(async () => []) } }));
vi.mock('./api/offers', () => ({ offersApi: { list: vi.fn(async () => []) } }));
vi.mock('./api/forecast', () => ({ forecastApi: { alerts: vi.fn(async () => []) } }));

import App from './App';

const at = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('routing', () => {
  beforeEach(() => { auth.session = { demo: true }; auth.facilityId = 'f1'; auth.me = { role: 'facility' }; });

  it('redirects unauthenticated visits to /login', () => {
    auth.session = null;
    at('/transfers/t1');
    expect(screen.getByText('Sign in with your hospital account')).toBeInTheDocument();
  });

  it('renders a /transfers/:id deep link', async () => {
    at('/transfers/t1');
    expect(await screen.findByText(/TRF-TEST/)).toBeInTheDocument();
  });

  it('renders a /requests/:id deep link', async () => {
    at('/requests/r1');
    expect(await screen.findByText(/REQ-TEST/)).toBeInTheDocument();
  });

  it('shows the 404 page for unknown paths', () => {
    at('/no/such/page');
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
