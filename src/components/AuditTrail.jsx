import React, { useState } from 'react';
import { formatDateTime } from '../utils/format';
import { actionLabel, groupConsecutive, isImportantAction } from '../utils/auditLabels';
import { Empty } from './ui';

function Detail({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-label="Audit entry detail">
      <button type="button" className="flex-1 bg-black/30" aria-label="Close detail" onClick={onClose} />
      <aside className="w-full max-w-md h-full bg-white shadow-xl border-l border-border-warm p-4 overflow-y-auto space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-extrabold">{actionLabel(entry.action)}</div>
            <div className="text-xs text-slate-500 font-mono">#{entry.seq} · {entry.action}</div>
          </div>
          <button type="button" className="text-xs font-semibold text-brand-burgundy" onClick={onClose}>Close</button>
        </div>
        <div className="text-xs space-y-1">
          <div><span className="text-slate-400">When </span>{formatDateTime(entry.at)}</div>
          <div><span className="text-slate-400">Actor </span>{entry.actor_role || '—'}</div>
          <div><span className="text-slate-400">Entity </span>{entry.entity_type || '—'} {entry.entity_id ? String(entry.entity_id).slice(0, 8) : ''}</div>
        </div>
        <pre className="bg-bg-inset rounded-lg p-2 overflow-x-auto text-[11px]">{JSON.stringify(entry.payload || {}, null, 2)}</pre>
        <div className="font-mono text-[10px] text-slate-500 break-all">hash {entry.hash}</div>
      </aside>
    </div>
  );
}

export default function AuditTrail({ entries, showEntity = false, group = true }) {
  const [open, setOpen] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  if (!entries || entries.length === 0) return <Empty>No audit entries.</Empty>;
  const items = group ? groupConsecutive(entries) : entries.map((entry) => ({ kind: 'single', entry }));

  return (
    <>
      <ol className="relative border-l-2 border-border-warm ml-2 space-y-3">
        {items.map((item) => {
          if (item.kind === 'group') {
            const key = `${item.action}-${item.first.seq}`;
            const isOpen = expanded.has(key);
            return (
              <li key={key} className="ml-4">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-slate-400 mt-1" />
                <button
                  type="button"
                  className="text-left text-sm font-semibold"
                  onClick={() => setExpanded((s) => {
                    const n = new Set(s);
                    if (n.has(key)) n.delete(key); else n.add(key);
                    return n;
                  })}
                >
                  {actionLabel(item.action)} ×{item.count}
                </button>
                <div className="text-xs text-slate-500">{formatDateTime(item.last.at)} → {formatDateTime(item.first.at)}</div>
                {isOpen && item.entries.map((e) => (
                  <button key={e.id || e.seq} type="button" className="block text-left text-xs mt-1 text-slate-600" onClick={() => setOpen(e)}>
                    #{e.seq} · {formatDateTime(e.at)}
                  </button>
                ))}
              </li>
            );
          }
          const e = item.entry;
          const important = isImportantAction(e.action);
          return (
            <li key={e.id || e.seq} className="ml-4">
              <span className={`absolute -left-[7px] w-3 h-3 rounded-full mt-1 ${important ? 'bg-red-600' : 'bg-brand-burgundy'}`} />
              <button type="button" className="text-left" onClick={() => setOpen(e)}>
                <div className={`text-sm font-semibold ${important ? 'text-red-700' : ''}`}>
                  {actionLabel(e.action)}
                  {showEntity && e.entity_type ? <span className="ml-2 font-mono text-xs text-slate-500">{e.entity_type}</span> : null}
                </div>
                <div className="text-xs text-slate-500">#{e.seq} · {formatDateTime(e.at)} · {e.actor_role}</div>
              </button>
            </li>
          );
        })}
      </ol>
      <Detail entry={open} onClose={() => setOpen(null)} />
    </>
  );
}
