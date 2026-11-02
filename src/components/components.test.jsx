import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import StatusBadge, { toneFor } from './StatusBadge';
import Countdown from './Countdown';
import CandidateList from './CandidateList';
import StageTimeline from './StageTimeline';

describe('StatusBadge', () => {
  it('humanises the value and picks a tone', () => {
    render(<StatusBadge value="in_transit" />);
    expect(screen.getByText('In transit')).toBeInTheDocument();
    expect(toneFor('emergency')).toBe('red');
    expect(toneFor('unknown')).toBe('grey');
  });
});

describe('Countdown', () => {
  it('ticks down and shows timeout', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T10:00:00Z'));
    render(<Countdown until="2026-11-03T10:00:03Z" />);
    expect(screen.getByText(/00:03/)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('Timed out')).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('CandidateList', () => {
  const cand = {
    rank: 1, donor_facility_id: 'd1', donor_name: 'Nairobi Hospital Hub', donor_level_label: 'Level 5',
    distance_km: 8.6, road_minutes: 18, handling_minutes: 20, elapsed_minutes: 38, eta_source: 'estimate',
    current_stock: 6, post_transfer_units: 4, post_transfer_cover_days: 4, cold_chain_viable: true, earliest_expiry: '2026-11-05T09:00:00Z',
  };
  it('labels estimated ETAs and sends an offer', () => {
    const onOffer = vi.fn();
    render(<CandidateList candidates={[cand]} onOffer={onOffer} canOffer />);
    expect(screen.getByTestId('eta')).toHaveTextContent('38 min (estimate)');
    fireEvent.click(screen.getByText('Send offer'));
    expect(onOffer).toHaveBeenCalledWith(cand);
  });
  it('shows an empty state', () => {
    render(<CandidateList candidates={[]} />);
    expect(screen.getByText(/No eligible donors/)).toBeInTheDocument();
  });
});

describe('StageTimeline', () => {
  it('shows all stages and the cancel reason', () => {
    const { rerender } = render(<StageTimeline transfer={{ stage: 'packed', stage_history: [] }} />);
    expect(screen.getByText('Courier assigned')).toBeInTheDocument();
    rerender(<StageTimeline transfer={{ stage: 'cancelled', cancel_reason: 'pack_timeout' }} />);
    expect(screen.getByText(/pack_timeout/)).toBeInTheDocument();
  });
});

