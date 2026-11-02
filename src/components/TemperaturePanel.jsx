import React from 'react';
import { Thermometer } from 'lucide-react';
import { formatTemp, formatTime } from '../utils/format';
import { isExcursion, TEMP_BANDS } from '../utils/temperature';
import { Empty } from './ui';

export default function TemperaturePanel({ readings, productType, excursion }) {
  const band = TEMP_BANDS[productType];
  const list = readings || [];
  const latest = list[list.length - 1];
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Thermometer className={`w-5 h-5 ${excursion ? 'text-status-crimson' : 'text-brand-cobalt'}`} />
        <div className="text-lg font-bold">{latest ? formatTemp(latest.temp_c) : '—'}</div>
        {band && <span className="text-xs text-slate-500">Safe band {band[0]}–{band[1]} °C</span>}
        {excursion && <span className="text-xs font-bold text-status-crimson">Excursion recorded</span>}
      </div>
      {list.length === 0 ? <Empty>No readings yet.</Empty> : (
        <div className="flex flex-wrap gap-1">
          {list.slice(-24).map((r) => (
            <span key={r.id} title={`${formatTime(r.recorded_at)} EAT · ${r.source}`}
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isExcursion(r.temp_c, productType, r) ? 'bg-status-crimson text-white' : 'bg-bg-inset border border-border-warm'}`}>
              {Number(r.temp_c).toFixed(1)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
