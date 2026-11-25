import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { requestsApi } from '../api/requests';
import { offersApi } from '../api/offers';
import { facilitiesApi } from '../api/facilities';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import CandidateList from '../components/CandidateList';
import ManualRequestPicker from '../components/ManualRequestPicker';
import Countdown from '../components/Countdown';
import BackToList from '../components/BackToList';
import { formatDateTime, formatEta } from '../utils/format';
import { productLabel } from '../utils/constants';
import {
  CANDIDATE_SCOPES,
  adaptCandidatesResponse,
  filterFallbacksForRequest,
  formatCandidateOfferError,
  readOfferFallbackLabel,
  readOfferWarnings,
} from '../lib/candidateAdapter';

const ACTIVE_OFFER = ['pending', 'held', 'accepted', 'packed'];

function DetailBack() {
  return <BackToList to="/requests" label="Back to requests" selectedId={useParams().id} className="mt-2" />;
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const { facilityId } = useAuth();
  const [scope, setScope] = useState(CANDIDATE_SCOPES.REGIONAL);
  const [includeCompatible, setIncludeCompatible] = useState(false);
  const [offerWarnings, setOfferWarnings] = useState([]);
  const [manualActive, setManualActive] = useState(false);

  useEffect(() => {
    setScope(CANDIDATE_SCOPES.REGIONAL);
    setIncludeCompatible(false);
    setOfferWarnings([]);
    setManualActive(false);
  }, [id]);

  const req = useAsync(() => requestsApi.get(id), [id], { interval: 15000 });
  const r = req.data;
  const isRecipient = Boolean(r && (!r.recipient_facility_id || !facilityId || r.recipient_facility_id === facilityId));
  const cands = useAsync(
    () => (r && r.status === 'open' && isRecipient
      ? requestsApi.candidates(id, { scope, includeCompatible })
      : Promise.resolve(null)),
    [id, r?.status, isRecipient, scope, includeCompatible],
  );
  const offers = useAsync(() => offersApi.list('outgoing', undefined, id), [id, r?.status], { interval: 15000 });
  const facilities = useAsync(
    () => (manualActive && isRecipient ? facilitiesApi.list() : Promise.resolve(null)),
    [manualActive, isRecipient],
  );
  const action = useAction();

  async function sendOffer(c, opts) {
    setOfferWarnings([]);
    const payloadOpts = opts?.override
      ? opts
      : {
          ...opts,
          scope: scope === CANDIDATE_SCOPES.NATIONAL ? CANDIDATE_SCOPES.NATIONAL : undefined,
        };
    const res = await action.run(() => requestsApi.sendOffer(id, c.donor_facility_id, payloadOpts));
    if (res) {
      setOfferWarnings(readOfferWarnings(res));
      req.reload();
      offers.reload();
      return true;
    }
    return false;
  }

  async function cancel() {
    if (await action.run(() => requestsApi.cancel(id, 'Cancelled by facility'))) req.reload();
  }

  if (req.loading) return <Loading />;
  if (!r) {
    return (
      <div>
        <ErrorBanner error={req.error || { message: 'Request not found.' }} />
        <DetailBack />
      </div>
    );
  }

  const offerRows = Array.isArray(offers.data) ? offers.data : offers.data?.items || [];
  const activeOffer = offerRows.find((o) => ACTIVE_OFFER.includes(o.status));
  const activeOfferFallback = readOfferFallbackLabel(activeOffer);
  const activeOfferWarnings = readOfferWarnings(activeOffer);
  const adapted = adaptCandidatesResponse(cands.data);
  const fallbacks = filterFallbacksForRequest(adapted?.fallbacksAvailable, r);
  const actionError = formatCandidateOfferError(action.error);
  const candsError = formatCandidateOfferError(cands.error);
  const showingCompatible = Boolean(adapted?.includeCompatible || includeCompatible);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${r.request_code} · ${r.units_requested} × ${r.blood_group}`}
        subtitle={`${productLabel(r.product_type)} · created ${formatDateTime(r.created_at)}`}
        actions={isRecipient && ['suggested', 'open', 'offered'].includes(r.status) && (
          <Button variant="danger" busy={action.busy} onClick={cancel}>Cancel request</Button>
        )}
      />
      <ErrorBanner error={actionError} />
      {offerWarnings.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-[color:var(--caelum-amber-text)]/40 bg-bg-inset px-3 py-2 text-sm text-[color:var(--caelum-amber-text)]"
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
          <div>
            <div className="font-semibold">Offer sent with warnings:</div>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
              {offerWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}
      <Card>
        <div className="flex flex-wrap gap-4 text-sm text-[color:var(--caelum-text)]">
          <div><span className="label">Status</span><StatusBadge value={r.status} /></div>
          <div><span className="label">Urgency</span><StatusBadge value={r.urgency} /></div>
          <div><span className="label">Reason</span>{r.reason || '—'}</div>
          <div><span className="label">Needed by</span>{formatDateTime(r.needed_by)}</div>
          {r.transfer_id && <div><span className="label">Transfer</span><Link className="text-brand-cobalt font-semibold" to={`/transfers/${r.transfer_id}`}>Open transfer</Link></div>}
        </div>
      </Card>
      {activeOffer && (
        <Card title="Current offer">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--caelum-text)]">
            <span className="font-mono text-xs">{activeOffer.offer_code}</span>
            <StatusBadge value={activeOffer.status} />
            {activeOfferFallback && (
              <span className="inline-flex items-center rounded-full border border-[color:var(--caelum-amber-text)]/40 bg-bg-inset px-2 py-0.5 text-xs font-semibold text-[color:var(--caelum-amber-text)]">
                {activeOfferFallback}
              </span>
            )}
            <span>ETA {formatEta(activeOffer.eta_minutes, activeOffer.eta_source)}</span>
            {['pending', 'held'].includes(activeOffer.status) && <Countdown until={activeOffer.expires_at} label="Donor must answer in" />}
          </div>
          {activeOfferWarnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-[color:var(--caelum-amber-text)] space-y-0.5">
              {activeOfferWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          )}
        </Card>
      )}
      {r.status === 'open' && isRecipient && (
        <Card title="Ranked candidate donors">
          <ErrorBanner error={candsError} />
          {candsError && !cands.loading && <DetailBack />}
          {(cands.loading || (!adapted && !candsError)) ? <Loading label="Ranking donors…" /> : (
            <>
              {(adapted?.scope === CANDIDATE_SCOPES.NATIONAL || showingCompatible) && (
                <p className="text-xs text-[color:var(--caelum-text-muted)] mb-2">
                  {[
                    adapted?.scope === CANDIDATE_SCOPES.NATIONAL ? 'National search' : null,
                    showingCompatible ? 'Including compatible blood types' : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              {adapted?.rationale?.text && (
                <p className="text-sm text-[color:var(--caelum-text-muted)] mb-3">{adapted.rationale.text}</p>
              )}
              <CandidateList
                candidates={adapted?.candidates}
                onOffer={sendOffer}
                busy={action.busy}
                canOffer
                requestedBloodGroup={r.blood_group}
                onSearchNational={fallbacks.includes('national')
                  ? () => setScope(CANDIDATE_SCOPES.NATIONAL)
                  : undefined}
                onShowCompatible={fallbacks.includes('compatible')
                  ? () => setIncludeCompatible(true)
                  : undefined}
                onManualToggle={setManualActive}
                renderManualPicker={fallbacks.includes('manual')
                  ? ({ close }) => (
                      <ManualRequestPicker
                        facilities={facilities.data}
                        loading={facilities.loading}
                        error={facilities.error}
                        excludeFacilityId={facilityId}
                        busy={action.busy}
                        onCancel={() => { setManualActive(false); close(); }}
                        onSubmit={async ({ donorFacilityId, reason }) => {
                          const ok = await sendOffer(
                            { donor_facility_id: donorFacilityId },
                            { override: true, overrideReason: reason },
                          );
                          if (ok) { setManualActive(false); close(); }
                        }}
                      />
                  )
                  : undefined}
                emptyAction={<DetailBack />}
              />
              {(adapted?.policies || []).length > 0 && (
                <div className="mt-3 text-xs text-[color:var(--caelum-text-muted)]">
                  Policies: {adapted.policies.map((p) => `${p.title} §${p.section_ref || ''}`).join(' · ')}
                </div>
              )}
            </>
          )}
        </Card>
      )}
      {(r.status !== 'open' || !isRecipient) && !activeOffer && (
        <div>
          <Empty>{isRecipient ? 'Candidates are shown while the request is open.' : 'Candidate donors are only visible to the requesting hospital.'}</Empty>
          <DetailBack />
        </div>
      )}
    </div>
  );
}
