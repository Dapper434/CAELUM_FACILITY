import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

const requestsApi = vi.hoisted(() => ({
  get: vi.fn(),
  candidates: vi.fn(),
  sendOffer: vi.fn(),
  cancel: vi.fn(),
}));
const offersApi = vi.hoisted(() => ({ list: vi.fn() }));
const facilitiesApi = vi.hoisted(() => ({ list: vi.fn() }));
const authState = vi.hoisted(() => ({ facilityId: 'f1' }));

vi.mock('../api/requests', () => ({ requestsApi }));
vi.mock('../api/offers', () => ({ offersApi }));
vi.mock('../api/facilities', () => ({ facilitiesApi }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

import RequestDetailPage from './RequestDetailPage';

const baseRequest = {
  id: 'r1',
  request_code: 'REQ-1',
  recipient_facility_id: 'f1',
  units_requested: 2,
  blood_group: 'A+',
  product_type: 'packed_rbc',
  status: 'open',
  urgency: 'urgent',
  created_at: '2026-11-01T00:00:00Z',
  needed_by: null,
  reason: 'Surgery',
};

function show(path = '/requests/r1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/requests" element={<p>Requests list</p>} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequestDetailPage fallbacks (contract 1.10.0)', () => {
  beforeEach(() => {
    authState.facilityId = 'f1';
    requestsApi.get.mockReset().mockResolvedValue(baseRequest);
    requestsApi.candidates.mockReset();
    requestsApi.sendOffer.mockReset();
    offersApi.list.mockReset().mockResolvedValue([]);
    facilitiesApi.list.mockReset().mockResolvedValue([
      { id: 'f1', name: 'Kapsabet Hospital', county: 'Nandi', level_label: 'Level 4' },
      { id: 'f2', name: 'Moi Teaching and Referral', county: 'Uasin Gishu', level_label: 'Level 6' },
      { id: 'f3', name: 'Coast General', county: 'Mombasa', level_label: 'Level 5' },
    ]);
  });

  it('shows the empty state with back button and no fallback buttons when fallbacks_available is missing', async () => {
    requestsApi.candidates.mockResolvedValue({ candidates: [] });
    show();
    expect(await screen.findByText('No eligible donors in region')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show compatible blood types' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request from a hospital manually' })).toBeNull();
  });

  it('hides Search nationally for emergency requests even if fallbacks_available includes national', async () => {
    requestsApi.get.mockResolvedValue({ ...baseRequest, urgency: 'emergency' });
    requestsApi.candidates.mockResolvedValue({
      candidates: [],
      fallbacks_available: ['national', 'compatible', 'manual'],
    });
    show();

    expect(await screen.findByText('No eligible donors in region')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Show compatible blood types' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request from a hospital manually' })).toBeInTheDocument();
  });

  it('renders rules text and fallback buttons, and refetches with scope=national after confirm', async () => {
    requestsApi.candidates.mockResolvedValueOnce({
      scope: 'regional',
      candidates: [],
      fallbacks_available: ['national', 'compatible', 'manual'],
      rationale: { text: 'No regional donor meets the 3-day safety reserve.' },
    });
    requestsApi.candidates.mockResolvedValueOnce({
      scope: 'national',
      candidates: [],
      fallbacks_available: ['compatible', 'manual'],
      rationale: { text: 'No exact match nationally.' },
    });
    show();

    expect(await screen.findByText('No regional donor meets the 3-day safety reserve.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Search nationally' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/nationally/i);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(requestsApi.candidates).toHaveBeenCalledWith('r1', {
      scope: 'national',
      includeCompatible: false,
    }));
    expect(await screen.findByText('No exact match nationally.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
  });

  it('refetches with includeCompatible=true, sends optional substitute_reason, and shows warnings', async () => {
    requestsApi.candidates.mockResolvedValueOnce({
      scope: 'regional',
      candidates: [],
      fallbacks_available: ['compatible'],
    });
    requestsApi.candidates.mockResolvedValueOnce({
      include_compatible: true,
      candidates: [
        {
          rank: 1,
          donor_facility_id: 'f2',
          donor_name: 'Moi Teaching and Referral',
          donor_level_label: 'Level 6',
          distance_km: 42,
          road_minutes: 55,
          handling_minutes: 20,
          elapsed_minutes: 75,
          eta_source: 'estimate',
          current_stock: 10,
          post_transfer_units: 8,
          post_transfer_cover_days: 5,
          cold_chain_viable: true,
          earliest_expiry: '2026-12-01T00:00:00Z',
          substitute: true,
          substitute_group: 'O-',
          product: 'packed_rbc',
          note: 'Universal red-cell substitute; officer confirmation needed.',
        },
      ],
      fallbacks_available: [],
    });
    show();

    fireEvent.click(await screen.findByRole('button', { name: 'Show compatible blood types' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(requestsApi.candidates).toHaveBeenCalledWith('r1', {
      scope: 'regional',
      includeCompatible: true,
    }));
    expect(await screen.findByText('Substitute: O- for A+')).toBeInTheDocument();
    expect(screen.getByText('Universal red-cell substitute; officer confirmation needed.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send offer' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/O- for A\+/);
    expect(requestsApi.sendOffer).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reason (optional)'), {
      target: { value: 'Consultant approved O- red cells' },
    });

    requestsApi.sendOffer.mockResolvedValue({
      id: 'o1',
      fallback: 'substitute',
      warnings: ['Unverified cold chain on national route'],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm substitute offer' }));
    await waitFor(() => expect(requestsApi.sendOffer).toHaveBeenCalledWith('r1', 'f2', {
      confirmSubstitute: true,
      substituteReason: 'Consultant approved O- red cells',
      scope: undefined,
    }));
    expect(await screen.findByText('Unverified cold chain on national route')).toBeInTheDocument();
  });

  it('opens the manual hospital picker, excludes own facility, counts reason chars, and posts override:true', async () => {
    requestsApi.candidates.mockResolvedValue({
      scope: 'regional',
      candidates: [],
      fallbacks_available: ['manual'],
    });
    show();

    fireEvent.click(await screen.findByRole('button', { name: 'Request from a hospital manually' }));
    const select = await screen.findByLabelText('Hospital');
    expect(select.textContent).not.toContain('Kapsabet Hospital');
    expect(select.textContent).toContain('Moi Teaching and Referral');
    expect(select.textContent).toContain('Coast General');

    fireEvent.click(screen.getByRole('button', { name: 'Send manual request' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a hospital');

    fireEvent.change(select, { target: { value: 'f3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send manual request' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a reason');

    const reasonText = 'Emergency theatre case';
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reasonText } });
    expect(screen.getByTestId('reason-counter')).toHaveTextContent(`${reasonText.length}/500`);

    requestsApi.sendOffer.mockResolvedValue({ id: 'o2', fallback: 'manual_override', warnings: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Send manual request' }));

    await waitFor(() => expect(requestsApi.sendOffer).toHaveBeenCalledWith('r1', 'f3', {
      override: true,
      overrideReason: reasonText,
    }));
  });

  it.each([
    ['substitute_confirmation_required', /officer approves/i, false, undefined],
    ['override_reason_required', /500 characters/i, false, undefined],
    ['validation_error', /500 characters/i, false, 400],
    ['donor_not_eligible', /not eligible/i, false, 409],
    ['insufficient_stock', /enough matching stock/i, false, 409],
    ['reserve_breach', /Safety reserve block: Would breach 3-day safety reserve/, true, 409],
    ['forbidden', /requesting hospital/i, false, 403],
  ])('shows friendly error copy for %s', async (code, pattern, hardBlock, status) => {
    requestsApi.candidates.mockResolvedValue({
      scope: 'regional',
      candidates: [{
        rank: 1, donor_facility_id: 'f2', donor_name: 'Moi', donor_level_label: 'L6',
        distance_km: 12, road_minutes: 15, handling_minutes: 5, elapsed_minutes: 20, eta_source: 'estimate',
        current_stock: 5, post_transfer_units: 3, post_transfer_cover_days: 2, cold_chain_viable: true,
        earliest_expiry: '2026-12-01T00:00:00Z',
      }],
    });
    requestsApi.sendOffer.mockRejectedValue(Object.assign(
      new Error(code === 'reserve_breach' ? 'Would breach 3-day safety reserve' : 'raw api error'),
      { code, status },
    ));
    show();

    fireEvent.click(await screen.findByRole('button', { name: 'Send offer' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(pattern);
    if (hardBlock) expect(alert).toHaveAttribute('data-hard-block', 'true');
  });

  it('never shows candidates or fallback options to a donor viewing a request', async () => {
    authState.facilityId = 'donor-9';
    requestsApi.get.mockResolvedValue(baseRequest);
    show();

    expect(await screen.findByText(/REQ-1/)).toBeInTheDocument();
    expect(requestsApi.candidates).not.toHaveBeenCalled();
    expect(screen.queryByText('Ranked candidate donors')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
  });

  it.each([
    ['missing', undefined],
    ['null', null],
  ])('hides candidates and fallbacks when recipient_facility_id is %s', async (_label, recipientFacilityId) => {
    requestsApi.get.mockResolvedValue({ ...baseRequest, recipient_facility_id: recipientFacilityId });
    requestsApi.candidates.mockResolvedValue({
      candidates: [],
      fallbacks_available: ['national', 'compatible', 'manual'],
    });
    show();

    expect(await screen.findByText(/REQ-1/)).toBeInTheDocument();
    expect(await screen.findByText('Candidate donors are only visible to the requesting hospital.')).toBeInTheDocument();
    expect(requestsApi.candidates).not.toHaveBeenCalled();
    expect(screen.queryByText('Ranked candidate donors')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show compatible blood types' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request from a hospital manually' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
  });

  it('hides candidates and fallbacks when recipient_facility_id is present and different from the caller', async () => {
    authState.facilityId = 'fac-other';
    requestsApi.get.mockResolvedValue({ ...baseRequest, recipient_facility_id: 'f1' });
    requestsApi.candidates.mockResolvedValue({
      candidates: [],
      fallbacks_available: ['national', 'compatible', 'manual'],
    });
    show();

    expect(await screen.findByText(/REQ-1/)).toBeInTheDocument();
    expect(await screen.findByText('Candidate donors are only visible to the requesting hospital.')).toBeInTheDocument();
    expect(requestsApi.candidates).not.toHaveBeenCalled();
    expect(screen.queryByText('Ranked candidate donors')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show compatible blood types' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request from a hospital manually' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
  });

  it('shows fallback label and warnings from the 201 POST body on the recipient request view', async () => {
    requestsApi.candidates.mockResolvedValue({
      candidates: [{
        rank: 1, donor_facility_id: 'f2', donor_name: 'Moi', donor_level_label: 'L6',
        distance_km: 12, road_minutes: 15, handling_minutes: 5, elapsed_minutes: 20, eta_source: 'estimate',
        current_stock: 5, post_transfer_units: 3, post_transfer_cover_days: 2, cold_chain_viable: true,
        earliest_expiry: '2026-12-01T00:00:00Z',
      }],
    });
    requestsApi.sendOffer.mockResolvedValue({
      id: 'o-post',
      offer_code: 'OFR-9',
      blood_group: 'A+',
      fallback: 'manual_override',
      warnings: ['route_unverified: route needs verification'],
      status: 'pending',
    });
    show();

    fireEvent.click(await screen.findByRole('button', { name: 'Send offer' }));
    expect(await screen.findByTestId('offer-fallback-label')).toHaveTextContent('Manual override');
    expect(screen.getByText('route_unverified: route needs verification')).toBeInTheDocument();
  });

  it('derives Substitute: X for Y on the recipient request view when offer and request blood groups differ', async () => {
    requestsApi.candidates.mockResolvedValue({ candidates: [] });
    offersApi.list.mockResolvedValue([{
      id: 'o-later',
      offer_code: 'OFR-10',
      status: 'pending',
      blood_group: 'O-',
      eta_minutes: 40,
      eta_source: 'estimate',
      expires_at: new Date(Date.now() + 300000).toISOString(),
    }]);
    show();

    expect(await screen.findByTestId('offer-fallback-label')).toHaveTextContent('Substitute: O- for A+');
    expect(screen.queryByTestId('offer-warnings')).toBeNull();
    expect(screen.queryByText('Manual override')).toBeNull();
  });
});
