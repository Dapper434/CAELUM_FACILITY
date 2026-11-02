import React from 'react';
import { formatDateTime, humanize } from '../utils/format';
import { Empty } from './ui';

export default function AuditTrail({ entries, showEntity = false }) {
  if (!entries || entries.length === 0) return <Empty>No audit entries.</Empty>;
  return (
    <ol className="relative border-l-2 border-border-warm ml-2 space-y-3">
      {entries.map((e) => (
        <li key={e.id || e.seq} className="ml-4">
          <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-brand-burgundy mt-1" />
          <div className="text-sm font-semibold">{e.action}{showEntity && e.transfer_code ? <span className="ml-2 font-mono text-xs text-slate-500">{e.transfer_code}</span> : null}</div>
          <div className="text-xs text-slate-500">#{e.seq} · {formatDateTime(e.at)} · {humanize(e.actor_role)}</div>
          {e.payload && Object.keys(e.payload).length > 0 && (
            <div className="text-[11px] font-mono text-slate-500 break-all">{JSON.stringify(e.payload)}</div>
          )}
          <div className="text-[10px] font-mono text-slate-400" title={e.hash}>hash {String(e.hash || '').slice(0, 16)}…</div>
        </li>
      ))}
    </ol>
  );
}
