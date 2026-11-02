import React from 'react';
import { Link, useParams } from 'react-router';
import { requestsApi } from '../api/requests';
import { offersApi } from '../api/offers';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import CandidateList from '../components/CandidateList';
import Countdown from '../components/Countdown';
import { formatDateTime, formatEta } from '../utils/format';
import { productLabel } from '../utils/constants';

const ACTIVE_OFFER = ['pending', 'held', 'accepted', 'packed'];

export default function RequestDetailPage() {
  const { id } = useParams();
  const req = useAsync(() => requestsApi.get(id), [id], { interval: 15000 });
  const r = req.data;
  const cands = useAsync(() => (r && r.status === 'open' ? requestsApi.candidates(id) : Promise.resolve(null)), [id, r?.status]);
  const offers = useAsync(() => offersApi.list('outgoing', undefined, id), [id, r?.status], { interval: 15000 });
  const action = useAction();

  async function sendOffer(c) {
    if (await action.run(() => requestsApi.sendOffer(id, c.donor_facility_id))) { req.reload(); offers.reload(); }
  }
  async function cancel() {
    if (await action.run(() => requestsApi.cancel(id, 'Cancelled by facility'))) req.reload();
  }

  if (req.loading) return <Loading />;
  if (!r) return <ErrorBanner error={req.error} />;
  const activeOffer = (offers.data || []).find((o) => ACTIVE_OFFER.includes(o.status));
  return (
    <div className="space-y-4">
      <PageHeader
        title={`${r.request_code} · ${r.units_requested} × ${r.blood_group}`}
        subtitle={`${productLabel(r.product_type)} · created ${formatDateTime(r.created_at)}`}
        actions={['suggested', 'open', 'offered'].includes(r.status) && <Button variant="danger" busy={action.busy} onClick={cancel}>Cancel request</Button>}
      />
      <ErrorBanner error={action.error} />
      <Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="label">Status</span><StatusBadge value={r.status} /></div>
          <div><span className="label">Urgency</span><StatusBadge value={r.urgency} /></div>
          <div><span className="label">Reason</span>{r.reason || '—'}</div>
          <div><span className="label">Needed by</span>{formatDateTime(r.needed_by)}</div>
          {r.transfer_id && <div><span className="label">Transfer</span><Link className="text-brand-cobalt font-semibold" to={`/transfers/${r.transfer_id}`}>Open transfer</Link></div>}
        </div>
      </Card>
      {activeOffer && (
        <Card title="Current offer">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-mono text-xs">{activeOffer.offer_code}</span>
            <StatusBadge value={activeOffer.status} />
            <span>ETA {formatEta(activeOffer.eta_minutes, activeOffer.eta_source)}</span>
            {['pending', 'held'].includes(activeOffer.status) && <Countdown until={activeOffer.expires_at} label="Donor must answer in" />}
          </div>
        </Card>
      )}
      {r.status === 'open' && (
        <Card title="Ranked candidate donors">
          <ErrorBanner error={cands.error} />
          {cands.loading ? <Loading label="Ranking donors…" /> : (
            <>
              {cands.data?.rationale?.text && <p className="text-sm text-slate-600 mb-3">{cands.data.rationale.text}</p>}
              <CandidateList candidates={cands.data?.candidates} onOffer={sendOffer} busy={action.busy} canOffer />
              {(cands.data?.policies || []).length > 0 && (
                <div className="mt-3 text-xs text-slate-500">Policies: {cands.data.policies.map((p) => `${p.title} §${p.section_ref || ''}`).join(' · ')}</div>
              )}
            </>
          )}
        </Card>
      )}
      {r.status !== 'open' && !activeOffer && <Empty>Candidates are shown while the request is open.</Empty>}
    </div>
  );
}
