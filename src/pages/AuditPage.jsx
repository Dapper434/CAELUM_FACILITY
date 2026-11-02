import React, { useEffect, useState } from 'react';
import { facilitiesApi } from '../api/facilities';
import { useAuth } from '../context/AuthContext';
import { useAction } from '../hooks/useAction';
import { Button, Card, ErrorBanner, Loading, PageHeader } from '../components/ui';
import AuditTrail from '../components/AuditTrail';

/** Append a page, keeping newest-first order and dropping duplicates by seq. */
export function appendPage(existing, page) {
  const seen = new Set(existing.map((e) => e.seq));
  return [...existing, ...page.filter((e) => !seen.has(e.seq))].sort((a, b) => b.seq - a.seq);
}

export default function AuditPage() {
  const { facilityId } = useAuth();
  const [entries, setEntries] = useState([]);
  const [next, setNext] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const action = useAction();

  async function load(beforeSeq) {
    const res = await action.run(() => facilitiesApi.audit(facilityId, { limit: 50, beforeSeq }));
    if (res) {
      setEntries((prev) => (beforeSeq ? appendPage(prev, res.data || []) : appendPage([], res.data || [])));
      setNext(res.meta?.next_before_seq ?? null);
    }
    setLoaded(true);
  }

  useEffect(() => { if (facilityId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [facilityId]);

  return (
    <div>
      <PageHeader title="Audit trail" subtitle="Hash-chained entries for this facility: its units, requests, offers and transfers" />
      <Card>
        <ErrorBanner error={action.error} />
        {!loaded ? <Loading /> : <AuditTrail entries={entries} showEntity />}
        {next !== null && (
          <div className="mt-4"><Button variant="ghost" busy={action.busy} onClick={() => load(next)}>Load older entries</Button></div>
        )}
      </Card>
    </div>
  );
}
