import React, { useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useEscapeBack } from '../hooks/useEscapeBack';
import BackToList from './BackToList';

/**
 * List + optional detail. On md+ screens the list stays visible beside the
 * panel; on small screens the detail replaces the list. The list stays mounted
 * so filters, selection and scroll position are kept.
 */
export default function ListDetailLayout({
  list,
  backTo,
  backLabel,
  param = 'id',
  outletContext,
}) {
  const params = useParams();
  const selectedId = params[param];
  const detailOpen = Boolean(selectedId);
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    navigate({ pathname: backTo, search: location.search }, { state: { selectedId } });
  }, [navigate, backTo, location.search, selectedId]);

  useEscapeBack(goBack, { enabled: detailOpen });

  return (
    <div data-list-detail className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <div
        data-list-scroll
        className={`min-h-0 min-w-0 overflow-y-auto ${detailOpen ? 'hidden md:block md:flex-1' : 'flex-1'}`}
      >
        {list}
      </div>
      {detailOpen && (
        <section
          data-detail-panel
          aria-label="Details"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-xl border border-border-warm bg-bg-surface p-4 shadow-card sm:p-5"
        >
          <div className="mb-4 shrink-0">
            <BackToList to={backTo} label={backLabel} selectedId={selectedId} />
          </div>
          <div className="min-h-0 flex-1">
            <Outlet context={outletContext} />
          </div>
        </section>
      )}
    </div>
  );
}

/** Highlight the row or card the user opened (or just returned from). */
export function selectedClass(isSelected) {
  return isSelected
    ? 'bg-bg-inset outline outline-2 outline-offset-[-2px] outline-[color:var(--caelum-cobalt-text)]'
    : '';
}
