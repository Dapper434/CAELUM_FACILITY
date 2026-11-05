import React, { useCallback, useEffect, useState } from 'react';
import { facilitiesApi } from '../api/facilities';
import { useAuth } from '../context/AuthContext';
import { useAction } from '../hooks/useAction';
import { Button, Card, ErrorBanner, Loading, PageHeader } from '../components/ui';
import AuditTrail from '../components/AuditTrail';
import { actionLabel, categoryLabel } from '../utils/auditLabels';

/** Append a page, keeping newest-first order and dropping duplicates by seq. */
export function appendPage(existing, page) {
  const seen = new Set(existing.map((e) => e.seq));
  return [...existing, ...page.filter((e) => !seen.has(e.seq))].sort((a, b) => b.seq - a.seq);
}

function SummaryStrip({ summary }) {
  if (!summary) return null;
  const cats = Object.entries(summary.by_category || {});
  return (
    <Card className="mb-4">
      <div className="text-xs font-semibold mb-1">Last {summary.window}: {summary.total} events · {summary.important} important</div>
      <div className="flex flex-wrap gap-1.5">
        {cats.map(([cat, n]) => (
          <span key={cat} className="text-[11px] px-2 py-0.5 rounded-full bg-bg-inset border border-border-warm">
            {categoryLabel(cat)} · {n}
          </span>
        ))}
      </div>
      {summary.top_actions?.length > 0 && (
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          Top: {summary.top_actions.slice(0, 4).map((t) => `${actionLabel(t.action)} (${t.count})`).join(' · ')}
        </div>
      )}
    </Card>
  );
}

export default function AuditPage() {
  const { facilityId } = useAuth();
  const [entries, setEntries] = useState([]);
  const [next, setNext] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [importantOnly, setImportantOnly] = useState(true);
  const [timeWindow, setTimeWindow] = useState('7d');
  const [q, setQ] = useState('');
  const [summary, setSummary] = useState(null);
  const action = useAction();

  const load = useCallback(async (beforeSeq) => {
    if (!facilityId) return;
    const res = await action.run(() => facilitiesApi.audit(facilityId, {
      limit: 50,
      beforeSeq,
      important: importantOnly,
      window: timeWindow || undefined,
      q: q || undefined,
    }));
    if (res) {
      setEntries((prev) => (beforeSeq ? appendPage(prev, res.data || []) : appendPage([], res.data || [])));
      setNext(res.meta?.next_before_seq ?? null);
    }
    setLoaded(true);
    // action.run is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, importantOnly, timeWindow, q]);

  const loadSummary = useCallback(async () => {
    if (!facilityId) return;
    try {
      const s = await facilitiesApi.auditSummary(facilityId, { window: timeWindow || '7d' });
      setSummary(s);
    } catch {
      setSummary(null);
    }
  }, [facilityId, timeWindow]);

  useEffect(() => {
    if (facilityId) {
      setLoaded(false);
      load();
      loadSummary();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [facilityId, importantOnly, timeWindow]);

  const onExport = async () => {
    const blob = await action.run(() => facilitiesApi.auditExport(facilityId, {
      important: importantOnly,
      window: timeWindow || undefined,
      q: q || undefined,
      limit: 2000,
    }));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facility-audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Audit trail"
        subtitle="Changes for this facility. Important events are shown first."
        actions={(
          <>
            <Button variant="ghost" busy={action.busy} onClick={onExport}>Export CSV</Button>
          </>
        )}
      />
      <SummaryStrip summary={summary} />
      <Card>
        <form
          className="flex flex-wrap gap-3 items-end mb-4"
          onSubmit={(e) => { e.preventDefault(); setLoaded(false); load(); loadSummary(); }}
        >
          <label className="text-xs flex items-center gap-1.5">
            <input type="checkbox" checked={importantOnly} onChange={(e) => setImportantOnly(e.target.checked)} />
            Important only
          </label>
          <select aria-label="Window" className="border rounded-lg px-2 py-1.5 text-xs" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}>
            <option value="1d">Last day</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="">Any time</option>
          </select>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
            <input
              aria-label="Search"
              placeholder="Search…"
              className="border rounded-lg px-2 py-1.5 text-xs flex-1 min-w-[8rem] sm:max-w-xs"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button type="submit" variant="ghost" className="shrink-0">Filter</Button>
          </div>
        </form>
        <ErrorBanner error={action.error} />
        {!loaded ? <Loading /> : (
          <AuditTrail
            entries={entries}
            showEntity
          />
        )}
        {loaded && entries.length === 0 && importantOnly && (
          <p className="text-xs text-slate-500 mt-2">No important events in this window. Turn off “Important only” to see everything.</p>
        )}
        {next !== null && (
          <div className="mt-4">
            <Button variant="ghost" busy={action.busy} onClick={() => load(next)}>Load older entries</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
