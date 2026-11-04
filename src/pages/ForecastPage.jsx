import React, { useState } from 'react';
import { forecastApi } from '../api/forecast';
import { useAuth } from '../context/AuthContext';
import { requestsApi } from '../api/requests';
import { useAsync } from '../hooks/useAsync';
import { runLabel, summaryText, useForecastRun } from '../hooks/useForecastRun';
import { isValidBloodGroup } from '../utils/bloodGroup';
import { Button, Card, Empty, ErrorBanner, Loading, PageHeader } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import BloodFilters from '../components/BloodFilters';
import SuggestedRequestCard from '../components/SuggestedRequestCard';
import { formatDateTime } from '../utils/format';

export const DEFAULT_FORECAST_FILTERS = { blood_group: 'O-', product_type: 'packed_rbc' };

/** 422 insufficient_history is an expected empty state, not a failure. */
export function isInsufficientHistory(err) {
  return Boolean(err) && err.status === 422 && err.code === 'insufficient_history';
}

/** Forecast history points → bar data. */
export function toBars(history) {
  return (history || []).map((h) => ({ date: h.date, units: Number(h.units_issued) || 0 }));
}

function DemandBars({ days, compact }) {
  const max = Math.max(1, ...days.map((d) => d.units));
  return (
    <div className={`flex items-end ${compact ? 'gap-0.5' : 'gap-2'} h-32 mt-3`}>
      {days.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.units}`} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
          {!compact && <span className="text-[10px] font-mono text-slate-500">{d.units.toFixed(1)}</span>}
          <div className="w-full bg-brand-cobalt/80 rounded-t" style={{ height: `${(d.units / max) * 90}%` }} />
          {!compact && <span className="text-[10px] text-slate-500">{d.date.slice(5)}</span>}
        </div>
      ))}
    </div>
  );
}

export default function ForecastPage() {
  const { facilityId } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FORECAST_FILTERS);
  // Only ask for a forecast once a real blood group is picked.
  const groupOk = isValidBloodGroup(filters.blood_group);
  const forecast = useAsync(() => (groupOk ? forecastApi.get(filters) : Promise.resolve(null)), [filters.blood_group, filters.product_type]);
  const history = useAsync(() => (groupOk ? forecastApi.history({ ...filters, days: 28 }) : Promise.resolve(null)), [filters.blood_group, filters.product_type]);
  const alerts = useAsync(() => forecastApi.alerts(), []);
  const suggested = useAsync(() => requestsApi.list('suggested'), []);
  const run = useForecastRun({
    onSucceeded: () => { forecast.reload(); history.reload(); alerts.reload(); suggested.reload(); },
  });

  const f = forecast.data;
  const insufficient = isInsufficientHistory(forecast.error);
  const historyInsufficient = isInsufficientHistory(history.error);
  return (
    <div className="space-y-4">
      <PageHeader title="Forecast & alerts" subtitle="Demand forecast, shortage alerts and suggested requests"
        actions={<Button busy={run.active} onClick={run.start}>{runLabel(run.job, run.active)}</Button>} />
      <ErrorBanner error={run.error} />
      {run.summary && (
        <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{summaryText(run.summary)}</div>
      )}
      {run.warnings.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-semibold">Forecast finished, but {run.warnings.length} facilit{run.warnings.length === 1 ? 'y' : 'ies'} could not be forecast:</p>
          <ul className="list-disc ml-5 mt-1">
            {run.warnings.map((w, i) => <li key={`${w.facility_id}-${i}`}>{w.facility_id === facilityId ? 'This facility' : w.facility_id}: {w.error}</li>)}
          </ul>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="7-day demand forecast">
          <BloodFilters value={filters} onChange={setFilters} />
          {forecast.loading ? <Loading /> : insufficient ? <Empty>Not enough history yet for this group.</Empty> : (
            <>
              <ErrorBanner error={forecast.error} />
              {f && (
                <>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="rounded-xl bg-bg-inset p-2"><div className="label">On hand</div><div className="text-lg font-bold">{f.units_on_hand}</div></div>
                    <div className="rounded-xl bg-bg-inset p-2"><div className="label">Days cover</div><div className={`text-lg font-bold ${f.days_of_cover < 3 ? 'text-status-crimson' : ''}`}>{f.days_of_cover}</div></div>
                    <div className="rounded-xl bg-bg-inset p-2"><div className="label">Avg / day</div><div className="text-lg font-bold">{f.average_daily_demand}</div></div>
                  </div>
                  <DemandBars days={f.daily_demand || []} />
                  <p className="text-[11px] text-slate-400 mt-2">Method: {f.method} · {f.history_points} history points</p>
                </>
              )}
            </>
          )}
        </Card>
        <Card title="Open shortage alerts">
          <ErrorBanner error={alerts.error} />
          {alerts.loading ? <Loading /> : (alerts.data || []).length === 0 ? <Empty>No open alerts.</Empty> : (
            <ul className="space-y-2">
              {alerts.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl bg-bg-inset border border-border-warm px-3 py-2">
                  <div>
                    <div className="text-sm font-bold">{a.blood_group} · {a.units_remaining} units · {a.days_of_cover} days</div>
                    <div className="text-xs text-slate-500">Depletes {formatDateTime(a.depletion_at)}</div>
                  </div>
                  <StatusBadge value={a.urgency} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title="Demand history (last 28 days)">
        {!historyInsufficient && <ErrorBanner error={history.error} />}
        {history.loading ? <Loading /> : historyInsufficient ? <Empty>Not enough history yet for this group.</Empty> : history.data && (
          <>
            <p className="text-xs text-slate-500">
              {history.data.from} → {history.data.to} · {history.data.total_issued} units issued · avg {history.data.average_daily}/day · {history.data.days_with_data} days with data
            </p>
            <DemandBars days={toBars(history.data.history)} compact />
          </>
        )}
      </Card>
      <Card title="Forecast-suggested requests">
        <ErrorBanner error={suggested.error} />
        {suggested.loading ? <Loading /> : (suggested.data || []).length === 0 ? <Empty>No suggestions waiting.</Empty> : (
          <div className="grid md:grid-cols-2 gap-3">
            {suggested.data.map((r) => <SuggestedRequestCard key={r.id} request={r} onChange={suggested.reload} />)}
          </div>
        )}
      </Card>
    </div>
  );
}
