import React from 'react';
import { Snowflake } from 'lucide-react';
import { Button } from './ui';
import { formatDateTime, formatEta } from '../utils/format';
import SubstitutePill from './SubstitutePill';
import CandidatesEmpty from './CandidatesEmpty';

export default function CandidateList({
  candidates,
  onOffer,
  busy,
  canOffer,
  emptyAction,
  requestedBloodGroup,
  onSearchNational,
  onShowCompatible,
  onManualRequest,
}) {
  if (!candidates || candidates.length === 0) {
    return (
      <CandidatesEmpty
        onSearchNational={onSearchNational}
        onShowCompatible={onShowCompatible}
        onManualRequest={onManualRequest}
      >
        {emptyAction}
      </CandidatesEmpty>
    );
  }
  return (
    <ol className="space-y-2">
      {candidates.map((c) => (
        <li key={c.donor_facility_id} className="rounded-xl border border-border-warm bg-bg-inset p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-cobalt text-white text-xs font-bold flex items-center justify-center">{c.rank}</span>
            <div>
              <div className="text-sm font-bold">{c.donor_name} <span className="text-xs font-normal text-slate-600">{c.donor_level_label}</span></div>
              <div className="text-xs text-slate-600">
                ETA <strong data-testid="eta">{formatEta(c.elapsed_minutes, c.eta_source)}</strong>
                {' '}· {c.distance_km} km · road {c.road_minutes} + handling {c.handling_minutes} min
              </div>
              <div className="text-xs text-slate-600">
                Stock {c.current_stock} → {c.post_transfer_units} · {c.post_transfer_cover_days} days cover after · earliest expiry {formatDateTime(c.earliest_expiry)}
              </div>
              {c.cold_chain_viable && <div className="text-xs text-emerald-text flex items-center gap-1 mt-0.5"><Snowflake className="w-3 h-3" /> Cold chain viable</div>}
              {c.substitute === true && (
                <div className="mt-1">
                  <SubstitutePill
                    donorType={c.blood_group || c.donor_blood_group}
                    requestedType={c.requested_blood_group || requestedBloodGroup}
                  />
                </div>
              )}
            </div>
          </div>
          {canOffer && <Button busy={busy} onClick={() => onOffer(c)}>Send offer</Button>}
        </li>
      ))}
    </ol>
  );
}
