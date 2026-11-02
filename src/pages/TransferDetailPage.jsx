import React from 'react';
import { useParams } from 'react-router';
import { transfersApi } from '../api/transfers';
import { useAsync } from '../hooks/useAsync';
import { useAction } from '../hooks/useAction';
import { useAuth } from '../context/AuthContext';
import { Button, Card, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import StageTimeline from '../components/StageTimeline';
import TrackingMap from '../components/TrackingMap';
import TemperaturePanel from '../components/TemperaturePanel';
import DonorCustodyPanel from '../components/DonorCustodyPanel';
import RecipientCustodyPanel from '../components/RecipientCustodyPanel';
import CustodyEvents from '../components/CustodyEvents';
import AuditTrail from '../components/AuditTrail';
import { formatEta } from '../utils/format';
import { productLabel } from '../utils/constants';
import { transferRole } from '../utils/roles';

const LIVE = ['courier_assigned', 'in_transit', 'arrived'];

export default function TransferDetailPage() {
  const { id } = useParams();
  const { facilityId } = useAuth();
  const t = useAsync(() => transfersApi.get(id), [id], { interval: 15000 });
  const stage = t.data?.stage;
  const live = LIVE.includes(stage);
  const tracking = useAsync(() => transfersApi.tracking(id), [id, stage], { interval: live ? 10000 : 0 });
  const temps = useAsync(() => transfersApi.temperature(id), [id, stage], { interval: live ? 15000 : 0 });
  const custody = useAsync(() => transfersApi.custody(id), [id, stage]);
  const audit = useAsync(() => transfersApi.audit(id), [id, stage]);
  const action = useAction();

  if (t.loading) return <Loading />;
  if (!t.data) return <ErrorBanner error={t.error} />;
  const tr = t.data;
  const role = transferRole(tr, facilityId);
  const refresh = () => { t.reload(); custody.reload(); audit.reload(); };
  async function cancel() { if (await action.run(() => transfersApi.cancel(id, 'Cancelled by facility'))) refresh(); }
  const eta = tracking.data?.eta;

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${tr.transfer_code} · ${tr.quantity} × ${tr.blood_group}`}
        subtitle={`${productLabel(tr.product_type)} · manifest ${tr.manifest_code} · ${role ? `you are the ${role}` : 'role unknown'}`}
        actions={role && ['accepted', 'packed', 'courier_assigned'].includes(tr.stage) && <Button variant="danger" busy={action.busy} onClick={cancel}>Cancel transfer</Button>}
      />
      <ErrorBanner error={action.error || t.error} />
      <Card title="Timeline" actions={<StatusBadge value={tr.stage} />}><StageTimeline transfer={tr} /></Card>
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Live tracking" className="lg:col-span-2">
          <ErrorBanner error={tracking.error} />
          <TrackingMap tracking={tracking.data} route={tr.route_geojson} />
          <div className="text-xs text-slate-600 mt-2">
            {eta ? <>Remaining {eta.remaining_km} km · <strong>{formatEta(eta.remaining_minutes, eta.eta_source)}</strong></>
              : <>Planned transit {formatEta(tr.transit_minutes, tr.eta_source)} · {tr.distance_km} km</>}
          </div>
        </Card>
        <Card title="Temperature">
          <ErrorBanner error={temps.error} />
          <TemperaturePanel readings={temps.data} productType={tr.product_type} excursion={tr.temperature_excursion} />
        </Card>
      </div>
      {role === 'donor' && <Card title="Pack & dispatch"><DonorCustodyPanel transfer={tr} onChange={refresh} /></Card>}
      {role === 'recipient' && <Card title="Custody handover"><RecipientCustodyPanel transfer={tr} onChange={refresh} /></Card>}
      {!role && <ErrorBanner error={{ message: 'Your facility could not be matched to this transfer, so custody actions are hidden.' }} />}
      {(tr.units || []).length > 0 && (
        <Card title="Units">
          <div className="flex flex-wrap gap-2">{tr.units.map((u) => <span key={u.id} className="font-mono text-xs bg-bg-inset border border-border-warm rounded px-2 py-1">{u.unit_code} <StatusBadge value={u.status} /></span>)}</div>
        </Card>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Custody events"><CustodyEvents events={custody.data} /></Card>
        <Card title="Audit trail"><ErrorBanner error={audit.error} /><AuditTrail entries={audit.data} /></Card>
      </div>
    </div>
  );
}
