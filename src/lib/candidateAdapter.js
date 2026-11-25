/**
 * Adapter for API contract 1.10.0 (no-candidate fallbacks).
 * Kept in one place so field or code renames only touch this file.
 */

export const CANDIDATE_SCOPES = {
  REGIONAL: 'regional',
  NATIONAL: 'national',
};

export const FALLBACK_KEYS = ['national', 'compatible', 'manual'];

const OFFER_FALLBACK_LABELS = {
  national: 'National search',
  substitute: 'Compatible substitute',
  manual_override: 'Manual override',
};

export function candidateQueryParams({ scope = CANDIDATE_SCOPES.REGIONAL, includeCompatible = false } = {}) {
  const params = {};
  if (scope && scope !== CANDIDATE_SCOPES.REGIONAL) params.scope = scope;
  if (includeCompatible) params.include_compatible = 'true';
  return Object.keys(params).length ? params : undefined;
}

export function adaptCandidateRow(row) {
  if (!row || typeof row !== 'object') return row;
  const substitute = row.substitute === true;
  return {
    ...row,
    substitute,
    substituteGroup: substitute ? (row.substitute_group || row.blood_group || row.donor_blood_group || null) : null,
    substituteProduct: substitute ? (row.product || row.product_type || null) : null,
    substituteNote: substitute ? (row.note || null) : null,
  };
}

export function adaptCandidatesResponse(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const candidates = Array.isArray(raw.candidates) ? raw.candidates.map(adaptCandidateRow) : [];
  const fallbacksAvailable = candidates.length === 0 && Array.isArray(raw.fallbacks_available)
    ? raw.fallbacks_available.filter((k) => FALLBACK_KEYS.includes(k))
    : [];
  const scope = raw.scope === CANDIDATE_SCOPES.NATIONAL
    ? CANDIDATE_SCOPES.NATIONAL
    : CANDIDATE_SCOPES.REGIONAL;
  const includeCompatible = raw.include_compatible === true;
  return {
    ...raw,
    scope,
    includeCompatible,
    candidates,
    fallbacksAvailable,
    rationale: raw.rationale || null,
    rationalePending: Boolean(raw.rationale_pending),
    policies: Array.isArray(raw.policies) ? raw.policies : [],
  };
}

export function filterFallbacksForRequest(fallbacksAvailable, request) {
  const list = Array.isArray(fallbacksAvailable) ? fallbacksAvailable : [];
  if (request?.urgency === 'emergency') {
    return list.filter((k) => k !== 'national');
  }
  return list;
}

export function buildOfferPayload(
  donorFacilityId,
  {
    scope,
    confirmSubstitute = false,
    substituteReason = '',
    override = false,
    overrideReason = '',
  } = {},
) {
  const body = { donor_facility_id: donorFacilityId };
  if (scope === CANDIDATE_SCOPES.NATIONAL || scope === CANDIDATE_SCOPES.REGIONAL) {
    if (scope === CANDIDATE_SCOPES.NATIONAL) body.scope = scope;
  }
  if (confirmSubstitute) {
    body.confirm_substitute = true;
    const trimmed = String(substituteReason || '').trim();
    if (trimmed) body.substitute_reason = trimmed;
  }
  if (override) {
    body.override = true;
    body.override_reason = String(overrideReason || '').trim();
  }
  return body;
}

export function readOfferWarnings(responseOrOffer) {
  return Array.isArray(responseOrOffer?.warnings) ? responseOrOffer.warnings.filter(Boolean) : [];
}

export function readOfferFallbackLabel(offer) {
  const key = offer?.fallback;
  return key ? (OFFER_FALLBACK_LABELS[key] || null) : null;
}

/** Derive a substitute pill when both blood groups are present and differ. */
export function substituteLabel(offerBloodGroup, requestBloodGroup) {
  if (!offerBloodGroup || !requestBloodGroup) return null;
  if (offerBloodGroup === requestBloodGroup) return null;
  return `Substitute: ${offerBloodGroup} for ${requestBloodGroup}`;
}

/**
 * Recipient-only offer chrome. GET /offers does not return fallback or warnings
 * (contract 1.10.0 at f584b50), so:
 * - use fallback + warnings[] from a 201 POST body while we still have it
 * - otherwise derive "Substitute: X for Y" from blood groups
 * - manual-override / national labels come only from that POST body
 */
export function deriveRecipientOfferFallback({ offer, requestBloodGroup, postResponse } = {}) {
  const sameOffer = Boolean(
    postResponse && (!offer?.id || !postResponse.id || offer.id === postResponse.id),
  );
  const source = sameOffer ? postResponse : null;
  const warnings = source ? readOfferWarnings(source) : [];
  const postLabel = source ? readOfferFallbackLabel(source) : null;
  const derived = substituteLabel(offer?.blood_group || source?.blood_group, requestBloodGroup);
  if (postLabel) {
    if (source.fallback === 'substitute' && derived) return { label: derived, warnings };
    return { label: postLabel, warnings };
  }
  return { label: derived, warnings: [] };
}

const ERROR_COPY = {
  substitute_confirmation_required: 'Confirm that an officer approves sending a compatible substitute before placing this offer.',
  override_reason_required: 'Enter a reason (up to 500 characters) for requesting from a hospital manually.',
  validation_error: 'Check your selection and keep any reason within 500 characters, then try again.',
  donor_not_eligible: 'That hospital is not eligible for this request under standard matching rules.',
  insufficient_stock: 'That hospital does not have enough matching stock right now.',
  reserve_breach: 'Transfer blocked: sending these units would breach the donor hospital’s safety reserve.',
  forbidden: 'Only the requesting hospital or an administrator can view candidates or place offers for this request.',
};

export function formatCandidateOfferError(err) {
  if (!err) return null;
  if (err.status === 403 && !ERROR_COPY[err.code]) {
    return { ...err, message: ERROR_COPY.forbidden };
  }
  const copy = ERROR_COPY[err.code];
  if (!copy) return err;
  if (err.code === 'reserve_breach') {
    const serverMessage = err.message && err.message !== err.code ? err.message : null;
    return {
      ...err,
      hardBlock: true,
      message: serverMessage ? `Safety reserve block: ${serverMessage}` : copy,
    };
  }
  return { ...err, message: copy };
}
