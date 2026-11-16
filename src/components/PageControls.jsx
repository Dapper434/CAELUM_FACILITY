import React from 'react';
import { Button } from './ui';
import { lastPage } from '../lib/pagination';

/** Prev / Next, "Page X of Y", and the total count. */
export default function PageControls({ page, pageSize, total, hasMore, onPage, disabled, noun = 'items' }) {
  const last = lastPage(total, pageSize);
  const shown = Math.min(Math.max(1, page || 1), last);
  const label = total === 1 ? noun.replace(/s$/, '') : noun;
  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 mt-3" aria-label="Pagination">
      <p className="text-xs text-slate-600">{total} {label}</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" disabled={disabled || shown <= 1} onClick={() => onPage(shown - 1)}>Prev</Button>
        <span className="text-xs text-slate-600">Page {shown} of {last}</span>
        <Button type="button" variant="ghost" disabled={disabled || shown >= last || hasMore === false && shown >= last} onClick={() => onPage(shown + 1)}>Next</Button>
      </div>
    </nav>
  );
}
