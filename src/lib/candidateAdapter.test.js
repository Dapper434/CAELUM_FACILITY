import { describe, expect, it } from 'vitest';
import {
  adaptCandidateRow,
  adaptCandidatesResponse,
  buildOfferPayload,
  candidateQueryParams,
  filterFallbacksForRequest,
  deriveRecipientOfferFallback,
  formatCandidateOfferError,
  readOfferFallbackLabel,
  readOfferWarnings,
} from './candidateAdapter';

describe('candidateAdapter', () => {
  it('omits default candidate query params and sends national / compatible flags when set', () => {
    expect(candidateQueryParams()).toBeUndefined();
    expect(candidateQueryParams({ scope: 'regional', includeCompatible: false })).toBeUndefined();
    expect(candidateQueryParams({ scope: 'national' })).toEqual({ scope: 'national' });
    expect(candidateQueryParams({ scope: 'national', includeCompatible: true })).toEqual({
      scope: 'national',
      include_compatible: 'true',
    });
  });

  it('handles exact 1.9.0 responses defensively when new fields are absent', () => {
    const res190 = adaptCandidatesResponse({
      request_id: 'r1',
      candidates: [{ rank: 1, donor_facility_id: 'd1', donor_name: 'Nairobi Hub' }],
      rationale: { text: 'Nearest hub', source: 'template', llm_used: false },
      rationale_pending: false,
      policies: [],
    });
    expect(res190.scope).toBe('regional');
    expect(res190.includeCompatible).toBe(false);
    expect(res190.fallbacksAvailable).toEqual([]);
    expect(res190.candidates[0]).toMatchObject({
      substitute: false,
      substituteGroup: null,
      substituteProduct: null,
      substituteNote: null,
    });

    const empty190 = adaptCandidatesResponse({ request_id: 'r1', candidates: [] });
    expect(empty190.scope).toBe('regional');
    expect(empty190.includeCompatible).toBe(false);
    expect(empty190.fallbacksAvailable).toEqual([]);
  });

  it('treats missing or non-national scope as regional and missing substitute as false', () => {
    expect(adaptCandidatesResponse({ candidates: [], scope: undefined }).scope).toBe('regional');
    expect(adaptCandidatesResponse({ candidates: [], scope: null }).scope).toBe('regional');
    expect(adaptCandidatesResponse({ candidates: [], scope: 'national', include_compatible: true })).toMatchObject({
      scope: 'national',
      includeCompatible: true,
    });

    expect(adaptCandidateRow({ donor_facility_id: 'd1' })).toMatchObject({
      substitute: false,
      substituteGroup: null,
      substituteProduct: null,
      substituteNote: null,
    });
    expect(adaptCandidateRow({ donor_facility_id: 'd1', substitute: true })).toMatchObject({
      substitute: true,
      substituteGroup: null,
      substituteProduct: null,
      substituteNote: null,
    });
  });

  it('normalizes fallbacks_available, hides national on emergency requests, and preserves substitute metadata', () => {
    const emptyWithFallbacks = adaptCandidatesResponse({
      candidates: [],
      fallbacks_available: ['national', 'compatible', 'manual', 'unknown'],
      rationale: { text: 'No regional match' },
    });
    expect(emptyWithFallbacks.scope).toBe('regional');
    expect(emptyWithFallbacks.fallbacksAvailable).toEqual(['national', 'compatible', 'manual']);
    expect(filterFallbacksForRequest(emptyWithFallbacks.fallbacksAvailable, { urgency: 'urgent' }))
      .toEqual(['national', 'compatible', 'manual']);
    expect(filterFallbacksForRequest(emptyWithFallbacks.fallbacksAvailable, { urgency: 'emergency' }))
      .toEqual(['compatible', 'manual']);

    const withRows = adaptCandidatesResponse({
      scope: 'national',
      include_compatible: true,
      fallbacks_available: ['manual'],
      candidates: [
        { donor_facility_id: 'd1', substitute: true, substitute_group: 'O-', product: 'packed_rbc', note: 'Compatible emergency match' },
      ],
    });
    expect(withRows.fallbacksAvailable).toEqual([]);
    expect(withRows.includeCompatible).toBe(true);
    expect(withRows.candidates[0]).toMatchObject({
      substitute: true,
      substituteGroup: 'O-',
      substituteProduct: 'packed_rbc',
      substituteNote: 'Compatible emergency match',
    });
  });

  it('builds standard, national, substitute (with optional reason), and manual override offer payloads', () => {
    expect(buildOfferPayload('d1')).toEqual({ donor_facility_id: 'd1' });
    expect(buildOfferPayload('d1', { scope: 'national' })).toEqual({
      donor_facility_id: 'd1',
      scope: 'national',
    });
    expect(buildOfferPayload('d1', { confirmSubstitute: true, substituteReason: '   ' })).toEqual({
      donor_facility_id: 'd1',
      confirm_substitute: true,
    });
    expect(buildOfferPayload('d1', { confirmSubstitute: true, substituteReason: '  Clinical approval  ' })).toEqual({
      donor_facility_id: 'd1',
      confirm_substitute: true,
      substitute_reason: 'Clinical approval',
    });
    expect(buildOfferPayload('d1', { override: true, overrideReason: '  Urgent theatre case  ' })).toEqual({
      donor_facility_id: 'd1',
      override: true,
      override_reason: 'Urgent theatre case',
    });
  });

  it('reads warnings, fallback labels, and maps final contract error codes', () => {
    expect(readOfferWarnings({ warnings: ['Unverified cold chain'] })).toEqual(['Unverified cold chain']);
    expect(readOfferWarnings({})).toEqual([]);

    expect(readOfferFallbackLabel({ fallback: 'national' })).toBe('National search');
    expect(readOfferFallbackLabel({ fallback: 'substitute' })).toBe('Compatible substitute');
    expect(readOfferFallbackLabel({ fallback: 'manual_override' })).toBe('Manual override');
    expect(readOfferFallbackLabel({})).toBeNull();

    expect(deriveRecipientOfferFallback({
      postResponse: { id: 'o1', fallback: 'manual_override', warnings: ['route_unverified: check the route'], blood_group: 'A+' },
      offer: { id: 'o1', blood_group: 'A+' },
      requestBloodGroup: 'A+',
    })).toEqual({ label: 'Manual override', warnings: ['route_unverified: check the route'] });

    expect(deriveRecipientOfferFallback({
      postResponse: { id: 'o1', fallback: 'substitute', warnings: ['cold_chain_cap_exceeded: 4h'], blood_group: 'O-' },
      offer: { id: 'o1', blood_group: 'O-' },
      requestBloodGroup: 'A+',
    })).toEqual({ label: 'Substitute: O- for A+', warnings: ['cold_chain_cap_exceeded: 4h'] });

    expect(deriveRecipientOfferFallback({
      offer: { id: 'o2', blood_group: 'O-' },
      requestBloodGroup: 'A+',
    })).toEqual({ label: 'Substitute: O- for A+', warnings: [] });

    expect(deriveRecipientOfferFallback({
      offer: { id: 'o2', blood_group: 'A+' },
      requestBloodGroup: 'A+',
    })).toEqual({ label: null, warnings: [] });

    expect(deriveRecipientOfferFallback({
      offer: { id: 'o2' },
      requestBloodGroup: 'A+',
    })).toEqual({ label: null, warnings: [] });

    expect(deriveRecipientOfferFallback({
      offer: { id: 'o2', blood_group: 'O-', fallback: 'manual_override', warnings: ['should-not-appear'] },
      requestBloodGroup: 'A+',
    })).toEqual({ label: 'Substitute: O- for A+', warnings: [] });

    expect(formatCandidateOfferError({ code: 'substitute_confirmation_required', message: 'raw' }).message)
      .toMatch(/officer approves/i);
    expect(formatCandidateOfferError({ code: 'override_reason_required', message: 'raw' }).message)
      .toMatch(/500 characters/i);
    expect(formatCandidateOfferError({ code: 'validation_error', message: 'raw' }).message)
      .toMatch(/500 characters/i);
    expect(formatCandidateOfferError({ code: 'donor_not_eligible', message: 'raw' }).message)
      .toMatch(/not eligible/i);
    expect(formatCandidateOfferError({ code: 'insufficient_stock', message: 'raw' }).message)
      .toMatch(/enough matching stock/i);
    expect(formatCandidateOfferError({ status: 403, code: 'forbidden', message: 'raw' }).message)
      .toMatch(/requesting hospital/i);

    const breach = formatCandidateOfferError({ code: 'reserve_breach', message: 'Donor only has 2 days left' });
    expect(breach.hardBlock).toBe(true);
    expect(breach.message).toContain('Safety reserve block');
    expect(breach.message).toContain('Donor only has 2 days left');
  });
});
