import React from 'react';
import { Snowflake } from 'lucide-react';
import { Button, Empty } from './ui';
import { formatDateTime, formatEta } from '../utils/format';

export default function CandidateList({ candidates, onOffer, busy, canOffer }) {
  if (!candidates || candidates.length === 0) return <Empty>No eligible donors right now.</Empty>;
  return (
    <ol className="space-y-2">
      {candidates.map((c) => (
        <li key={c.donor_facility_id} className="rounded-xl border border-border-warm bg-bg-inset p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-cobalt text-white text-xs font-bold flex items-center justify-center">{c.rank}</span>
            <div>
              <div className="text-sm font-bold">{c.donor_name} <span className="text-xs font-normal text-slate-500">{c.donor_level_label}</span></div>
              <div className="text-xs text-slate-600">
                ETA <strong data-testid="eta">{formatEta(c.elapsed_minutes, c.eta_source)}</strong>
                {' '}· {c.distance_km} km · road {c.road_minutes} + handling {c.handling_minutes} min
              </div>
              <div className="text-xs text-slate-500">
                Stock {c.current_stock} → {c.post_transfer_units} · {c.post_transfer_cover_days} days cover after · earliest expiry {formatDateTime(c.earliest_expiry)}
              </div>
              {c.cold_chain_viable && <div className="text-[11px] text-status-emerald flex items-center gap-1 mt-0.5"><Snowflake className="w-3 h-3" /> Cold chain viable</div>}
            </div>
          </div>
          {canOffer && <Button busy={busy} onClick={() => onOffer(c)}>Send offer</Button>}
        </li>
      ))}
    </ol>
  );
}
