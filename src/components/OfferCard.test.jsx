import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

vi.mock('../api/offers', () => ({
  offersApi: { hold: vi.fn(), accept: vi.fn(), decline: vi.fn() },
}));
import { offersApi } from '../api/offers';
import OfferCard from './OfferCard';

const offer = {
  id: 'o1', offer_code: 'OFR-1', status: 'pending', units_requested: 2, blood_group: 'O-', product_type: 'packed_rbc',
  distance_km: 8.6, eta_minutes: 38, eta_source: 'estimate', post_transfer_cover_days: 4, hold_extensions: 0,
  proposed_unit_codes: ['NHH-ONEG-001'], expires_at: new Date(Date.now() + 300000).toISOString(),
};

const renderCard = (props) => render(<MemoryRouter><OfferCard offer={offer} incoming {...props} /></MemoryRouter>);

describe('OfferCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the countdown and holds', async () => {
    offersApi.hold.mockResolvedValue({ ...offer, status: 'held' });
    const onChange = vi.fn();
    renderCard({ onChange });
    expect(screen.getByText(/Expires in/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hold'));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(offersApi.hold).toHaveBeenCalledWith('o1');
  });

  it('declines with a reason code', async () => {
    offersApi.decline.mockResolvedValue({ ...offer, status: 'declined' });
    renderCard({ onChange: vi.fn() });
    fireEvent.click(screen.getByText('Decline'));
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'no_courier' } });
    fireEvent.click(screen.getByText('Confirm decline'));
    await waitFor(() => expect(offersApi.decline).toHaveBeenCalledWith('o1', 'no_courier', undefined));
  });

  it('shows API errors', async () => {
    offersApi.accept.mockRejectedValue(Object.assign(new Error('Offer expired'), { code: 'invalid_state' }));
    renderCard();
    fireEvent.click(screen.getByText('Accept'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Offer expired (invalid_state)');
  });

  it('hides actions for outgoing offers', () => {
    renderCard({ incoming: false });
    expect(screen.queryByText('Accept')).toBeNull();
  });

  it('hides fallback label and warnings on the donor view of an incoming offer', () => {
    render(
      <MemoryRouter>
        <OfferCard
          incoming
          requestBloodGroup="A+"
          postResponse={{ fallback: 'manual_override', warnings: ['route_unverified: route needs verification'] }}
          offer={{
            ...offer,
            blood_group: 'O-',
            fallback: 'manual_override',
            warnings: ['route_unverified: route needs verification'],
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('offer-fallback-label')).toBeNull();
    expect(screen.queryByTestId('offer-warnings')).toBeNull();
    expect(screen.queryByText('Manual override')).toBeNull();
    expect(screen.queryByText(/Substitute:/)).toBeNull();
    expect(screen.queryByText(/route_unverified/)).toBeNull();
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('shows the POST 201 fallback label and warnings on the recipient view, then derives Substitute: X for Y', () => {
    const { rerender } = render(
      <MemoryRouter>
        <OfferCard
          incoming={false}
          requestBloodGroup="A+"
          postResponse={{
            id: 'o1',
            fallback: 'manual_override',
            warnings: ['route_unverified: route needs verification'],
            blood_group: 'A+',
          }}
          offer={{ ...offer, blood_group: 'A+' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('offer-fallback-label')).toHaveTextContent('Manual override');
    expect(screen.getByTestId('offer-warnings')).toHaveTextContent('route_unverified: route needs verification');

    rerender(
      <MemoryRouter>
        <OfferCard
          incoming={false}
          requestBloodGroup="A+"
          offer={{ ...offer, blood_group: 'O-' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('offer-fallback-label')).toHaveTextContent('Substitute: O- for A+');
    expect(screen.queryByTestId('offer-warnings')).toBeNull();
    expect(screen.queryByText('Manual override')).toBeNull();
  });

  it('does not derive a substitute label when blood groups are missing or the same', () => {
    const { rerender } = render(
      <MemoryRouter>
        <OfferCard incoming={false} requestBloodGroup="A+" offer={{ ...offer, blood_group: 'A+' }} />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('offer-fallback-label')).toBeNull();

    rerender(
      <MemoryRouter>
        <OfferCard incoming={false} offer={{ ...offer, blood_group: 'O-' }} />
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('offer-fallback-label')).toBeNull();
  });
});
