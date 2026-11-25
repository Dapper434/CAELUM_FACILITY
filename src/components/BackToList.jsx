import React from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';

/** Visible control that returns to a list, keeping that list's current search params. */
export default function BackToList({ to, label, selectedId, onClick, className = '' }) {
  const location = useLocation();
  const dest = typeof to === 'string'
    ? { pathname: to, search: location.search }
    : to;
  const state = selectedId ? { selectedId } : location.state;

  return (
    <Link
      to={dest}
      state={state}
      onClick={onClick}
      className={`inline-flex min-h-11 md:min-h-0 items-center gap-1.5 rounded-lg text-sm font-semibold text-[color:var(--caelum-cobalt-text)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal focus-visible:ring-offset-2 ${className}`}
    >
      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
