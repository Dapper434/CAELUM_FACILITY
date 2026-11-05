import React from 'react';

/**
 * Desktop: classic table. Mobile (< md): stacked cards so actions stay on-screen.
 * Pass either `card` (preferred) or rely on columns alone (label: value rows).
 */
export default function ResponsiveTable({
  columns,
  rows,
  keyOf = (row) => row.id,
  card,
  empty = null,
  afterRow,
  'aria-label': ariaLabel,
}) {
  if (!rows?.length) return empty;
  return (
    <>
      <ul className="md:hidden space-y-3" aria-label={ariaLabel}>
        {rows.map((row) => {
          const key = keyOf(row);
          return (
            <li key={key} className="rounded-xl border border-border-warm bg-bg-inset p-3 space-y-2">
              {card ? card(row) : (
                <dl className="space-y-1.5">
                  {columns.map((col) => (
                    <div key={col.header} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <dt className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{col.header}</dt>
                      <dd className={`text-sm text-right min-w-0 ${col.className || ''}`}>{col.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {afterRow?.(row)}
            </li>
          );
        })}
      </ul>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" aria-label={ariaLabel}>
          <thead>
            <tr>{columns.map((col) => <th key={col.header} className="th">{col.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = keyOf(row);
              return (
                <React.Fragment key={key}>
                  <tr className="hover:bg-bg-inset/60">
                    {columns.map((col) => (
                      <td key={col.header} className={`td ${col.className || ''}`}>{col.cell(row)}</td>
                    ))}
                  </tr>
                  {afterRow?.(row)}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
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
