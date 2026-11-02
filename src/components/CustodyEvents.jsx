import React from 'react';
import { formatDateTime, humanize } from '../utils/format';
import { Empty } from './ui';

export default function CustodyEvents({ events }) {
  if (!events || events.length === 0) return <Empty>No custody events yet.</Empty>;
  return (
    <ul className="space-y-1.5">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${e.ok ? 'bg-status-emerald' : 'bg-status-crimson'}`} />
          <span className="font-semibold">{humanize(e.event_type)}</span>
          <span className="text-slate-500">via {e.method}</span>
          {e.seal_number && <span className="font-mono text-slate-500">{e.seal_number}</span>}
          <span className="text-slate-400">{formatDateTime(e.occurred_at)}</span>
          {e.detail && <span className="text-status-crimson">{e.detail}</span>}
        </li>
      ))}
    </ul>
  );
}
