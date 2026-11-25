import React from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * Desktop (md+): classic table. Mobile: stacked cards so actions stay on-screen.
 * Only one surface is mounted, chosen via matchMedia('(min-width: 768px)').
 */
export default function ResponsiveTable({
  columns,
  rows,
  keyOf = (row) => row.id,
  card,
  empty = null,
  afterRow,
  selectedKey,
  'aria-label': ariaLabel,
}) {
  const desktop = useMediaQuery('(min-width: 768px)');
  if (!rows?.length) return empty;
  if (!desktop) {
  return (
      <ul className="space-y-3" aria-label={ariaLabel}>
        {rows.map((row) => {
          const key = keyOf(row);
          const selected = selectedKey != null && String(key) === String(selectedKey);
          return (
            <li
              key={key}
              data-selected={selected ? 'true' : undefined}
              aria-current={selected ? 'true' : undefined}
              className={`rounded-xl border border-border-warm bg-bg-inset p-3 space-y-2 ${selected ? 'outline outline-2 outline-offset-[-2px] outline-[color:var(--caelum-cobalt-text)]' : ''}`}
            >
              {card ? card(row) : (
                <dl className="space-y-1.5">
                  {columns.map((col) => (
                    <div key={col.header} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-600">{col.header}</dt>
                      <dd className={`text-sm text-right min-w-0 ${col.className || ''}`}>{col.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {afterRow?.(row, { surface: 'card' })}
            </li>
          );
        })}
      </ul>
  );
  }
  return (
      <div className="overflow-x-auto">
        <table className="w-full" aria-label={ariaLabel}>
          <thead>
            <tr>{columns.map((col) => <th key={col.header} className="th">{col.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = keyOf(row);
              const selected = selectedKey != null && String(key) === String(selectedKey);
              return (
                <React.Fragment key={key}>
                  <tr
                    data-selected={selected ? 'true' : undefined}
                    aria-current={selected ? 'true' : undefined}
                    className={`hover:bg-bg-inset/60 ${selected ? 'bg-bg-inset outline outline-2 outline-offset-[-2px] outline-[color:var(--caelum-cobalt-text)]' : ''}`}
                  >
                    {columns.map((col) => (
                      <td key={col.header} className={`td ${col.className || ''}`}>{col.cell(row)}</td>
                    ))}
                  </tr>
                  {afterRow?.(row, { surface: 'table' })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
  );
}

/** Wrap a wide table that should stay tabular; contains horizontal scroll on small screens. */
export function ScrollTable({ children, 'aria-label': ariaLabel }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
