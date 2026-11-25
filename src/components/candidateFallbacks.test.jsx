import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CandidateList from './CandidateList';
import BackToList from './BackToList';

const base = {
  rank: 1, donor_facility_id: 'd1', donor_name: 'Nairobi Hospital Hub', donor_level_label: 'Level 5',
  distance_km: 8.6, road_minutes: 18, handling_minutes: 20, elapsed_minutes: 38, eta_source: 'estimate',
  current_stock: 6, post_transfer_units: 4, post_transfer_cover_days: 4, cold_chain_viable: true,
  earliest_expiry: '2026-11-05T09:00:00Z',
};

describe('CandidateList empty state and substitute rows', () => {
  it('shows a regional empty message and keeps the back button, with no actions if handlers are omitted', () => {
    render(
      <MemoryRouter>
        <CandidateList
          candidates={[]}
          emptyAction={<BackToList to="/requests" label="Back to requests" />}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('No eligible donors in region')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to requests' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search nationally' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Show compatible types' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request from a hospital manually' })).toBeNull();
  });

  it('shows only the buttons whose handlers were passed, and runs the handler after confirm', () => {
    const onSearchNational = vi.fn();
    const onManualRequest = vi.fn();
    render(
      <CandidateList
        candidates={[]}
        onSearchNational={onSearchNational}
        onManualRequest={onManualRequest}
      />,
    );
    expect(screen.getByRole('button', { name: 'Search nationally' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request from a hospital manually' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show compatible types' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Search nationally' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/Search for donors nationally/);
    expect(onSearchNational).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onSearchNational).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Request from a hospital manually' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onManualRequest).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the confirm step on Escape without running the handler', () => {
    const onShowCompatible = vi.fn();
    render(<CandidateList candidates={[]} onShowCompatible={onShowCompatible} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show compatible types' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onShowCompatible).not.toHaveBeenCalled();
  });

  it('shows a substitute pill only when substitute is true', () => {
    const { rerender } = render(
      <CandidateList candidates={[{ ...base, blood_group: 'O-' }]} requestedBloodGroup="A+" />,
    );
    expect(screen.queryByText('Substitute: O- for A+')).toBeNull();

    rerender(
      <CandidateList
        candidates={[{ ...base, substitute: true, blood_group: 'O-' }]}
        requestedBloodGroup="A+"
      />,
    );
    expect(screen.getByText('Substitute: O- for A+')).toBeInTheDocument();
  });
});
