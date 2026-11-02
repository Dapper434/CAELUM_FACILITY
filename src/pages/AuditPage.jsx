import React from 'react';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { Card, ErrorBanner, Loading, PageHeader } from '../components/ui';
import AuditTrail from '../components/AuditTrail';

/** Merge per-transfer audit lists into one newest-first trail. */
export function mergeAudit(groups) {
  const seen = new Map();
  groups.forEach(({ transfer, entries }) => {
    (entries || []).forEach((e) => { if (!seen.has(e.seq)) seen.set(e.seq, { ...e, transfer_code: transfer.transfer_code }); });
  });
  return [...seen.values()].sort((a, b) => b.seq - a.seq);
}

export default function AuditPage() {
  const { data, error, loading } = useAsync(async () => {
    const transfers = await transfersApi.list();
    const groups = await Promise.all(transfers.map(async (t) => ({ transfer: t, entries: await transfersApi.audit(t.id) })));
    return mergeAudit(groups);
  }, []);
  return (
    <div>
      <PageHeader title="Audit trail" subtitle="Hash-chained audit entries for this facility's transfers" />
      <Card>
        <ErrorBanner error={error} />
        {loading ? <Loading /> : <AuditTrail entries={data} showEntity />}
      </Card>
    </div>
  );
}
