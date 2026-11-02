import React from 'react';
import { Check } from 'lucide-react';
import { TRANSFER_STAGES } from '../utils/constants';
import { formatDateTime, humanize } from '../utils/format';

export function stageIndex(stage) {
  return TRANSFER_STAGES.indexOf(stage);
}

export default function StageTimeline({ transfer }) {
  const history = transfer.stage_history || [];
  const current = stageIndex(transfer.stage);
  const at = (s) => [...history].reverse().find((h) => h.stage === s)?.at;
  if (transfer.stage === 'cancelled') {
    return <p className="text-sm text-brand-burgundy font-semibold">Cancelled{transfer.cancel_reason ? `: ${transfer.cancel_reason}` : ''}</p>;
  }
  return (
    <ol className="flex flex-col sm:flex-row gap-2">
      {TRANSFER_STAGES.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex-1 flex sm:flex-col items-center gap-2 sm:text-center">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-status-emerald text-white' : 'bg-slate-200 text-slate-500'}`}>
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <div>
              <div className={`text-xs font-semibold ${i === current ? 'text-brand-cobalt' : 'text-slate-700'}`}>{humanize(s)}</div>
              <div className="text-[10px] text-slate-400">{at(s) ? formatDateTime(at(s)) : ''}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
