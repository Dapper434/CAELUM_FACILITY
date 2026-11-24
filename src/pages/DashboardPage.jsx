import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Activity, AlertOctagon, AlertTriangle, ArrowRight, ArrowUpRight, BellRing, Building2, CalendarDays,
  CheckCircle2, ChevronDown, ClipboardList, Clock3, Droplets, Inbox, Info, Sparkles,
  Thermometer, Truck, UserRound,
} from 'lucide-react';
import { forecastApi } from '../api/forecast';
import { offersApi } from '../api/offers';
import { requestsApi } from '../api/requests';
import { transfersApi } from '../api/transfers';
import { inventoryApi } from '../api/inventory';
import { facilitiesApi } from '../api/facilities';
import { useAsync } from '../hooks/useAsync';
import { useCountUp } from '../hooks/useCountUp';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { actionLabel, isImportantAction } from '../utils/auditLabels';
import { formatDateTime, humanize } from '../utils/format';
import { transferRole } from '../utils/roles';
import { productLabel } from '../utils/constants';
import { readPage } from '../lib/pagination';

const TONES = {
  crimson: { icon: 'text-crimson-text', chip: 'border-red-100/80 bg-red-50/80' },
  amber: { icon: 'text-amber-text', chip: 'border-amber-100/80 bg-amber-50/80' },
  navy: { icon: 'text-clinic-navy', chip: 'border-clinic-border bg-bg-inset' },
  teal: { icon: 'text-clinic-teal', chip: 'border-teal-100/80 bg-clinic-teal-soft/80' },
  slate: { icon: 'text-slate-600', chip: 'border-clinic-border bg-bg-inset' },
};

const SEVERITY = {
  critical: {
    label: 'Critical', Icon: AlertOctagon, dot: 'bg-status-crimson',
    chip: 'border-red-200/70 bg-red-50/90 text-crimson-text', iconWrap: 'border-red-100/80 bg-red-50/80 text-crimson-text',
  },
  warning: {
    label: 'Warning', Icon: AlertTriangle, dot: 'bg-accent-yellow',
    chip: 'border-amber-200/70 bg-amber-50/90 text-amber-text', iconWrap: 'border-amber-100/80 bg-amber-50/80 text-amber-text',
  },
  info: {
    label: 'Informational', Icon: Info, dot: 'bg-slate-400',
    chip: 'border-slate-200/80 bg-slate-50 text-slate-600', iconWrap: 'border-clinic-border bg-bg-inset text-slate-500',
  },
};
const SEVERITY_ORDER = ['critical', 'warning', 'info'];

const INVENTORY_GROUPS = [
  { status: 'available', label: 'Available', color: 'bg-status-emerald' },
  { status: 'reserved', label: 'Reserved', color: 'bg-accent-yellow' },
  { status: 'in_transit', label: 'In transit', color: 'bg-clinic-teal' },
  { status: 'quarantined', label: 'Quarantined', color: 'bg-amber-700' },
  { status: 'transferred', label: 'Transferred', color: 'bg-slate-400' },
  { status: 'expired', label: 'Expired', color: 'bg-status-crimson' },
  { status: 'discarded', label: 'Discarded', color: 'bg-slate-300' },
];

const ACTIVITY_WINDOWS = [
  { id: 'today', label: 'Today', daysAgo: 0 },
  { id: '7d', label: '7 days', daysAgo: 6 },
  { id: '30d', label: '30 days', daysAgo: 29 },
];

const DASHBOARD_SECTIONS = [
  { href: '#your-attention', label: 'Attention' },
  { href: '#priority-attention', label: 'Alerts' },
  { href: '#inventory-intelligence', label: 'Inventory' },
  { href: '#recent-activity', label: 'Activity' },
  { href: '#active-transfers', label: 'Transfers' },
];

const TRANSFER_STAGES = ['accepted', 'packed', 'courier_assigned', 'in_transit', 'arrived', 'delivered'];
const numberFormat = new Intl.NumberFormat('en-GB');

function SectionCard({ id, title, description, action, children, className = '' }) {
  const headingId = `dash-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section id={id} aria-labelledby={headingId} className={`panel flex h-full scroll-mt-24 flex-col ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-clinic-border/80 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 id={headingId} className="text-sm font-semibold tracking-tight text-slate-900">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ViewAll({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-8 items-center gap-1 rounded-md text-xs font-semibold text-clinic-teal transition-colors hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal focus-visible:ring-offset-2"
    >
      {children} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} aria-hidden />;
}

function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3.5" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonLine className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3 w-2/5" />
            <SkeletonLine className="h-2.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelError({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-lg border border-clinic-border bg-bg-inset px-4 py-4">
      <p className="flex items-start gap-2 text-sm text-slate-600">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-text" aria-hidden />
        <span>{error?.message || 'This data could not be loaded.'}</span>
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md text-xs font-semibold text-clinic-teal hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-clinic-border bg-bg-inset/70 px-4 py-6 text-center">
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full border border-clinic-border bg-bg-surface text-slate-400">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      {title && <p className="mt-2 text-sm font-semibold text-slate-800">{title}</p>}
      {children && <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{children}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function AnimatedNumber({ value, className = '' }) {
  const display = useCountUp(value);
  return <span className={`stat-value ${className}`}>{display == null ? '—' : numberFormat.format(display)}</span>;
}

function KpiCard({ to, label, value, context, loading, error, tone = 'slate', icon: Icon }) {
  const look = TONES[tone] || TONES.slate;
  return (
    <Link
      to={to}
      className="group flex min-h-[132px] flex-col justify-between rounded-2xl border border-clinic-border bg-bg-surface p-4 shadow-panel transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-clinic-teal/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-slate-500">{label}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors ${look.chip}`}>
          <Icon className={`h-4 w-4 ${look.icon}`} aria-hidden />
        </span>
      </div>
      <div className="mt-4">
        {loading ? (
          <SkeletonLine className="h-8 w-14" />
        ) : (
          <AnimatedNumber
            value={value}
            className={`block text-[32px] font-semibold leading-none ${error ? 'text-slate-400' : 'text-slate-900'}`}
          />
        )}
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <span className={`text-xs leading-4 ${error ? 'text-amber-text' : 'text-slate-500'}`}>
            {context}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-clinic-teal" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

function severityKey(alert) {
  const urgency = String(alert?.urgency || '').toLowerCase();
  if (urgency === 'critical' || urgency === 'emergency') return 'critical';
  if (urgency === 'urgent' || urgency === 'warning' || urgency === 'moderate') return 'warning';
  return 'info';
}

function coverLabel(cover) {
  if (cover == null || cover === '') return 'Cover not available';
  const days = Number(cover);
  if (!Number.isFinite(days)) return 'Cover not available';
  const rounded = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${rounded} ${days === 1 ? 'day' : 'days'} of cover`;
}

function AlertRow({ alert, facility, expanded, onToggle }) {
  const severity = SEVERITY[severityKey(alert)];
  const { Icon } = severity;
  const detailId = `alert-detail-${alert.id}`;
  const buttonId = `alert-summary-${alert.id}`;
  const resource = `${alert.blood_group || 'Blood'} · ${productLabel(alert.product_type) || humanize(alert.product_type) || 'Blood product'}`;
  const location = [facility?.name, facility?.county].filter(Boolean).join(' · ') || 'This facility';
  const details = [
    ['Current stock', alert.units_remaining == null ? 'Not reported' : `${alert.units_remaining} units`],
    ['Days of cover', coverLabel(alert.days_of_cover)],
    ['Estimated depletion', formatDateTime(alert.depletion_at)],
    ['First detected', formatDateTime(alert.detected_at)],
    ['Last refreshed', formatDateTime(alert.updated_at)],
    ['Location', location],
  ];

  return (
    <li className="py-1">
      <div className="group flex items-start gap-1 rounded-lg transition-colors hover:bg-bg-inset">
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
        >
          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${severity.iconWrap}`}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-slate-900">{resource}</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] ${severity.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} aria-hidden />
                {severity.label}
              </span>
            </span>
            <span className="mt-1 block text-xs text-slate-600 tabular-nums">
              {alert.units_remaining ?? '—'} units on hand · {coverLabel(alert.days_of_cover)}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500 tabular-nums">
              Detected {formatDateTime(alert.detected_at)}
            </span>
          </span>
          <ChevronDown
            className={`mt-2 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-clinic-teal ${expanded ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>

        <Link
          to="/forecast"
          aria-label={`Review ${resource} in forecast and alerts`}
          className="mt-2 inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-clinic-teal transition-colors hover:bg-clinic-teal-soft hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal sm:mr-0.5"
        >
          <span>Review</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div
        id={detailId}
        role="region"
        aria-labelledby={buttonId}
        aria-hidden={!expanded}
        className={`accordion-panel ${expanded ? 'is-open' : ''}`}
      >
        <div>
          <div className="ml-11 mr-2 border-t border-clinic-border pb-3 pt-3">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {details.map(([term, value]) => (
                <div key={term} className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{term}</dt>
                  <dd className="mt-0.5 text-xs text-slate-700 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              to="/forecast"
              tabIndex={expanded ? undefined : -1}
              className="mt-3 inline-flex items-center gap-1 rounded text-xs font-semibold text-clinic-teal hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
            >
              Review in forecast & alerts <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}

function AlertsPanel({ alertsList, loading, error, facility, onRetry }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  if (loading && alertsList.length === 0) return <SkeletonList rows={3} />;
  if (error && alertsList.length === 0) return <PanelError error={error} onRetry={onRetry} />;
  if (alertsList.length === 0) {
    return (
      <EmptyState icon={CheckCircle2} title="No open shortage alerts">
        Stock levels are within the current forecast thresholds for this facility.
      </EmptyState>
    );
  }

  const counts = SEVERITY_ORDER.reduce((acc, key) => {
    acc[key] = alertsList.filter((alert) => severityKey(alert) === key).length;
    return acc;
  }, {});
  const filtered = filter === 'all' ? alertsList : alertsList.filter((alert) => severityKey(alert) === filter);
  const groups = SEVERITY_ORDER
    .map((key) => ({ key, meta: SEVERITY[key], rows: filtered.filter((alert) => severityKey(alert) === key) }))
    .filter((group) => group.rows.length > 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter alerts by severity">
        {[{ key: 'all', label: 'All', count: alertsList.length }, ...SEVERITY_ORDER.map((key) => ({ key, label: SEVERITY[key].label, count: counts[key] }))].map((option) => {
          const active = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.key)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal ${
                active
                  ? 'border-clinic-teal/30 bg-clinic-teal-soft text-clinic-navy'
                  : 'border-clinic-border bg-bg-surface text-slate-600 hover:border-clinic-teal/40 hover:bg-bg-inset hover:text-clinic-navy'
              }`}
            >
              {option.label}
              <span className={`tabular-nums ${active ? 'text-clinic-teal' : 'text-slate-400'}`}>{option.count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={`No ${SEVERITY[filter]?.label.toLowerCase() || ''} alerts`}
          action={(
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="rounded-md text-xs font-semibold text-clinic-teal hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
            >
              Show all alerts
            </button>
          )}
        >
          Other alerts may still need review.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.key} aria-label={`${group.meta.label} alerts`}>
              <h3 className="mb-1 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${group.meta.dot}`} aria-hidden />
                {group.meta.label}
                <span className="font-semibold tabular-nums text-slate-400">{group.rows.length}</span>
              </h3>
              <ul className="divide-y divide-clinic-border">
                {group.rows.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    facility={facility}
                    expanded={expanded === alert.id}
                    onToggle={() => setExpanded((current) => (current === alert.id ? null : alert.id))}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function percentLabel(count, total) {
  if (!total || !count) return '0%';
  const pct = (count / total) * 100;
  return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
}

function unitsLabel(count) {
  return `${numberFormat.format(count)} unit${count === 1 ? '' : 's'}`;
}

function InventoryPanel({ data, loading, error, onRetry }) {
  if (loading && !data) return <SkeletonList rows={4} />;
  if (error && !data) return <PanelError error={error} onRetry={onRetry} />;

  const counts = data?.statusCounts || {};
  const categorised = INVENTORY_GROUPS.reduce((sum, group) => sum + (counts[group.status] || 0), 0);
  const total = Math.max(Number(data?.total) || 0, categorised);
  const unclassified = Math.max(0, total - categorised);

  if (total === 0) {
    return (
      <div>
        <EmptyState icon={Droplets} title="No units recorded yet">
          Add or receive units to see this facility’s stock distribution.
        </EmptyState>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <ViewAll to="/inventory">Open inventory</ViewAll>
          <ViewAll to="/availability">Check availability</ViewAll>
        </div>
      </div>
    );
  }

  const visibleGroups = INVENTORY_GROUPS.filter((group) => (counts[group.status] || 0) > 0);
  const description = INVENTORY_GROUPS
    .map((group) => `${group.label} ${counts[group.status] || 0}`)
    .join(', ');

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tracked units</div>
          <div className="stat-value mt-1.5 text-[32px] font-semibold leading-none text-slate-900">{numberFormat.format(total)}</div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            Live counts · refreshed every minute
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-100/80 bg-clinic-teal-soft/70 px-2.5 py-1 text-xs font-semibold tabular-nums text-clinic-teal">
          {visibleGroups.length} status{visibleGroups.length === 1 ? '' : 'es'} in use
        </span>
      </div>

      <div
        className="inventory-bar mt-5 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-900/5"
        aria-label={`Inventory by status. ${description}. ${total} units total.`}
      >
        {visibleGroups.map((group) => {
          const count = counts[group.status] || 0;
          const pct = percentLabel(count, total);
          return (
            <Link
              key={group.status}
              to={`/inventory?status=${encodeURIComponent(group.status)}`}
              title={`${group.label}: ${unitsLabel(count)} (${pct}). Open filtered inventory.`}
              aria-label={`${group.label}: ${unitsLabel(count)}, ${pct} of tracked stock. Open filtered inventory.`}
              className={`${group.color} block h-full transition-[filter] hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white`}
              style={{ width: `${(count / total) * 100}%` }}
            />
          );
        })}
        {unclassified > 0 && (
          <span
            className="block h-full bg-slate-200"
            title={`Other states: ${unitsLabel(unclassified)}`}
            aria-hidden
            style={{ width: `${(unclassified / total) * 100}%` }}
          />
        )}
      </div>

      <ul className="mt-3 divide-y divide-clinic-border">
        {INVENTORY_GROUPS.map((group) => {
          const count = counts[group.status] || 0;
          const pct = percentLabel(count, total);
          return (
            <li key={group.status}>
              <Link
                to={`/inventory?status=${encodeURIComponent(group.status)}`}
                title={`${group.label}: ${unitsLabel(count)} (${pct}). Open filtered inventory.`}
                className={`group flex min-h-10 items-center gap-2 rounded-lg px-2 transition-colors hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal ${count ? '' : 'opacity-55'}`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${group.color}`} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-600 group-hover:text-slate-900">{group.label}</span>
                <span className="stat-value text-xs font-semibold text-slate-900">{numberFormat.format(count)}</span>
                <span className="stat-value w-10 text-right text-xs text-slate-500">{pct}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t border-clinic-border pt-3">
        {unclassified > 0 ? (
          <p className="flex items-start gap-1.5 text-xs leading-5 text-amber-text">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {numberFormat.format(unclassified)} unit{unclassified === 1 ? ' is' : 's are'} in a state outside these groups and{' '}
            {unclassified === 1 ? 'is' : 'are'} not shown individually.
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-emerald-text">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            All tracked units are accounted for.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <ViewAll to="/inventory">Open inventory</ViewAll>
          <ViewAll to="/availability">Check availability</ViewAll>
        </div>
      </div>
    </div>
  );
}

function nairobiStart(daysAgo = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value;
  const start = new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00+03:00`);
  start.setUTCDate(start.getUTCDate() - daysAgo);
  return start.toISOString();
}

function activityHref(entry) {
  const type = String(entry?.entity_type || '').toLowerCase();
  const id = entry?.entity_id;
  if (id && type === 'transfer') return `/transfers/${id}`;
  if (id && type === 'request') return `/requests/${id}`;
  return '/audit';
}

function activityVisual(entry) {
  const action = String(entry?.action || '');
  if (action.startsWith('temperature.')) {
    return { Icon: Thermometer, wrap: 'border-amber-100 bg-amber-50 text-amber-text' };
  }
  if (/(cancelled|declined|rejected|timeout|lapsed)/.test(action)) {
    return { Icon: AlertTriangle, wrap: 'border-red-100 bg-red-50 text-crimson-text' };
  }
  if (action.startsWith('inventory.')) return { Icon: Droplets, wrap: 'border-teal-100 bg-clinic-teal-soft text-clinic-teal' };
  if (action.startsWith('request.')) return { Icon: ClipboardList, wrap: 'border-clinic-border bg-bg-inset text-clinic-navy' };
  if (action.startsWith('offer.')) return { Icon: Inbox, wrap: 'border-clinic-border bg-bg-inset text-clinic-navy' };
  if (action.startsWith('transfer.')) return { Icon: Truck, wrap: 'border-teal-100 bg-clinic-teal-soft text-clinic-teal' };
  if (action.startsWith('custody.')) return { Icon: CheckCircle2, wrap: 'border-teal-100 bg-clinic-teal-soft text-clinic-teal' };
  if (action.startsWith('user.') || action.startsWith('courier.')) {
    return { Icon: UserRound, wrap: 'border-clinic-border bg-bg-inset text-slate-600' };
  }
  return { Icon: Activity, wrap: 'border-clinic-border bg-bg-inset text-slate-500' };
}

function ActivityPanel({ result, loading, error, windowId, onWindow, onRetry }) {
  const entries = Array.isArray(result?.data) ? result.data : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Activity period">
        {ACTIVITY_WINDOWS.map((option) => {
          const active = windowId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onWindow(option.id)}
              className={`min-h-8 rounded-full border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal ${
                active
                  ? 'border-clinic-teal/30 bg-clinic-teal-soft text-clinic-navy'
                  : 'border-clinic-border bg-bg-surface text-slate-600 hover:border-clinic-teal/40 hover:bg-bg-inset hover:text-clinic-navy'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {loading && entries.length === 0 ? (
        <SkeletonList rows={4} />
      ) : error && entries.length === 0 ? (
        <PanelError error={error} onRetry={onRetry} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          action={windowId !== '7d' ? (
            <button
              type="button"
              onClick={() => onWindow('7d')}
              className="rounded-md text-xs font-semibold text-clinic-teal hover:text-clinic-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
            >
              Show the last 7 days
            </button>
          ) : null}
        >
          {windowId === 'today'
            ? 'No audited events have been recorded today.'
            : 'No audited events match this period.'}
        </EmptyState>
      ) : (
        <ol className="relative">
          {entries.map((entry, index) => {
            const id = entry.id || entry.seq;
            const { Icon, wrap } = activityVisual(entry);
            const important = isImportantAction(entry.action);
            return (
              <li
                key={id}
                className="activity-enter relative pb-4 pl-10 last:pb-0"
                style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
              >
                <span className={`absolute left-0 top-0.5 grid h-7 w-7 place-items-center rounded-full border ${wrap}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {index < entries.length - 1 && (
                  <span className="absolute bottom-0 left-3.5 top-9 w-px bg-clinic-border" aria-hidden />
                )}
                <Link
                  to={activityHref(entry)}
                  className="group -mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
                >
                  <span className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-slate-800 group-hover:text-clinic-navy">
                      <span className="truncate">{actionLabel(entry.action)}</span>
                      {important && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Important event" aria-label="Important event" />
                      )}
                    </span>
                    <time className="shrink-0 text-xs tabular-nums text-slate-500" dateTime={entry.at || undefined}>
                      {formatDateTime(entry.at)}
                    </time>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {humanize(entry.entity_type) || 'Facility'}
                    {entry.actor_role ? ` · ${humanize(entry.actor_role)}` : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function TransferStageRail({ transfer }) {
  const current = TRANSFER_STAGES.indexOf(transfer.stage);
  return (
    <div className="mt-2">
      <div className="flex items-center gap-1" aria-hidden>
        {TRANSFER_STAGES.map((stage, index) => (
          <span
            key={stage}
            title={humanize(stage)}
            className={`h-1.5 flex-1 rounded-full ${index <= current ? 'bg-clinic-teal' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <span className="sr-only">
        Stage {current >= 0 ? current + 1 : 1} of {TRANSFER_STAGES.length}: {humanize(transfer.stage)}
      </span>
    </div>
  );
}

function TransfersPanel({ items, loading, error, facilityId, facility, facilitiesById, onRetry }) {
  if (loading && !items) return <SkeletonList rows={3} />;
  if (error && !items) return <PanelError error={error} onRetry={onRetry} />;
  if (!items || items.length === 0) {
    return (
      <EmptyState icon={Truck} title="No active transfers">
        Transfers where this facility is donor or recipient will appear here.
      </EmptyState>
    );
  }

  const facilityLabel = (id) => {
    if (id === facilityId) return facility?.name || 'This facility';
    return facilitiesById?.[id]?.name || 'Partner facility';
  };

  return (
    <ul className="divide-y divide-clinic-border">
      {items.map((transfer) => {
        const role = transferRole(transfer, facilityId);
        return (
          <li key={transfer.id}>
            <Link
              to={`/transfers/${transfer.id}`}
              className="group -mx-2 block rounded-lg px-2 py-3 transition-colors hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
            >
              <span className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-semibold text-clinic-navy group-hover:text-clinic-teal">
                    {transfer.transfer_code}
                  </span>
                  <span className="mt-1 block text-[13px] font-semibold text-slate-900 tabular-nums">
                    {transfer.quantity} × {transfer.blood_group}
                    <span className="font-normal text-slate-500"> · {productLabel(transfer.product_type)}</span>
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-600">
                    <span className="truncate">{facilityLabel(transfer.donor_facility_id)}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                    <span className="truncate">{facilityLabel(transfer.recipient_facility_id)}</span>
                  </span>
                </span>
                <StatusBadge value={transfer.stage} />
              </span>
              <TransferStageRail transfer={transfer} />
              <span className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock3 className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  Started {formatDateTime(transfer.created_at)}
                </span>
                <span>{humanize(role) || 'Facility'} transfer</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function buildAttentionItems({ alerts, suggested, offers, transfers, facilityId }) {
  const items = [];
  const critical = alerts.filter((alert) => severityKey(alert) === 'critical');
  const warning = alerts.filter((alert) => severityKey(alert) === 'warning');
  const held = offers.filter((offer) => offer.status === 'held');
  const pending = offers.filter((offer) => offer.status === 'pending');

  critical.slice(0, 2).forEach((alert) => {
    items.push({
      key: `alert-${alert.id}`,
      to: '/forecast',
      label: 'Critical shortage',
      title: `${alert.blood_group || 'Blood'} · ${productLabel(alert.product_type) || 'Blood product'}`,
      meta: `${alert.units_remaining ?? '—'} units left · ${coverLabel(alert.days_of_cover)}`,
      icon: AlertOctagon,
      tone: 'border-red-100 bg-red-50 text-crimson-text',
    });
  });

  if (held[0]) {
    items.push({
      key: `held-${held[0].id}`,
      to: '/offers',
      label: 'Held offer',
      title: held[0].offer_code || 'Donor offer',
      meta: `${held[0].units_requested ?? '—'} units · respond by ${formatDateTime(held[0].expires_at)}`,
      icon: Clock3,
      tone: 'border-amber-100 bg-amber-50 text-amber-text',
    });
  }

  if (suggested[0]) {
    items.push({
      key: `suggested-${suggested[0].id}`,
      to: `/requests/${suggested[0].id}`,
      label: 'Suggested request',
      title: suggested[0].request_code || `${suggested[0].blood_group || 'Blood'} request`,
      meta: `${suggested[0].blood_group || '—'} · ${suggested[0].units_requested ?? '—'} units requested`,
      icon: Sparkles,
      tone: 'border-teal-100 bg-clinic-teal-soft text-clinic-teal',
    });
  }

  if (warning[0]) {
    items.push({
      key: `warning-${warning[0].id}`,
      to: '/forecast',
      label: 'Warning',
      title: `${warning[0].blood_group || 'Blood'} stock`,
      meta: `${warning[0].units_remaining ?? '—'} units left · ${coverLabel(warning[0].days_of_cover)}`,
      icon: AlertTriangle,
      tone: 'border-amber-100 bg-amber-50 text-amber-text',
    });
  }

  if (pending[0]) {
    items.push({
      key: `pending-${pending[0].id}`,
      to: '/offers',
      label: 'Offer awaiting reply',
      title: pending[0].offer_code || 'Donor offer',
      meta: `${pending[0].units_requested ?? '—'} units · respond by ${formatDateTime(pending[0].expires_at)}`,
      icon: Inbox,
      tone: 'border-clinic-border bg-bg-inset text-clinic-navy',
    });
  }

  if (transfers[0]) {
    items.push({
      key: `transfer-${transfers[0].id}`,
      to: `/transfers/${transfers[0].id}`,
      label: 'Active transfer',
      title: transfers[0].transfer_code || 'Transfer',
      meta: `${humanize(transfers[0].stage)} · ${transfers[0].quantity} × ${transfers[0].blood_group}`,
      icon: Truck,
      tone: 'border-clinic-border bg-bg-inset text-clinic-navy',
    });
  }

  return items.slice(0, 4);
}

function AttentionPanel({ items, loading, hasError }) {
  return (
    <section id="your-attention" aria-labelledby="attention-title" className="panel scroll-mt-24 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-clinic-border/80 px-5 py-4 sm:px-6">
        <div>
          <h2 id="attention-title" className="text-sm font-semibold tracking-tight text-slate-900">Your attention today</h2>
          <p className="mt-0.5 text-xs text-slate-500">Highest-priority items across your workflows, ordered by urgency.</p>
        </div>
        <span className="rounded-full border border-clinic-border bg-bg-inset px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
          Triage
        </span>
      </header>

      {loading && items.length === 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5 p-3 sm:p-4" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl border border-clinic-border bg-bg-surface p-4">
              <SkeletonLine className="h-8 w-8 rounded-lg" />
              <SkeletonLine className="mt-3 h-3 w-2/3" />
              <SkeletonLine className="mt-2 h-2.5 w-4/5" />
            </div>
          ))}
        </div>
      ) : items.length === 0 && hasError ? (
        <div className="flex items-center gap-3 px-5 py-5" role="status">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-amber-100 bg-amber-50 text-amber-text">
            <AlertTriangle className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Some attention items could not be loaded</p>
            <p className="mt-0.5 text-xs text-slate-500">The panels below show their own status and retry controls.</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-text">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Nothing needs attention right now</p>
            <p className="mt-0.5 text-xs text-slate-500">New alerts, suggested requests and offers will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5 p-3 sm:p-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                className="group flex min-h-[104px] flex-col justify-between rounded-xl border border-clinic-border bg-bg-surface p-4 shadow-card transition-[border-color,box-shadow,background-color] duration-150 hover:border-clinic-teal/40 hover:bg-bg-inset/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal motion-reduce:transition-none"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${item.tone}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-clinic-teal" aria-hidden />
                </span>
                <span className="mt-2 block">
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[13px] font-semibold text-slate-900">{item.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 tabular-nums">{item.meta}</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QuickActions() {
  const actions = [
    { to: '/inventory', label: 'View inventory', icon: Droplets },
    { to: '/requests', label: 'Review requests', icon: ClipboardList },
    { to: '/offers', label: 'Review donor offers', icon: Inbox },
    { to: '/transfers', label: 'Track transfers', icon: Truck },
  ];
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {actions.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group flex min-h-[52px] items-center gap-3 rounded-xl border border-clinic-border/80 bg-bg-inset/40 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-[border-color,background-color,color,box-shadow] duration-150 hover:border-clinic-teal/40 hover:bg-clinic-teal-soft/60 hover:text-clinic-navy hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-clinic-border bg-bg-surface text-clinic-teal">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">{label}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-clinic-teal" aria-hidden />
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { facility, facilityId } = useAuth();
  const [activityWindow, setActivityWindow] = useState('7d');

  const alerts = useAsync(() => forecastApi.alerts(), [], { interval: 30000 });
  const incoming = useAsync(() => offersApi.list('incoming'), [], { interval: 30000 });
  const suggested = useAsync(() => requestsApi.list('suggested'), [], { interval: 30000 });
  const open = useAsync(() => requestsApi.list('open'), [], { interval: 30000 });
  const transfers = useAsync(
    () => transfersApi.list({ active: 'true', page: 1, page_size: 5 }),
    [],
    { interval: 30000 },
  );
  const inventory = useAsync(async () => {
    const [statusRows, allUnits] = await Promise.all([
      Promise.all(INVENTORY_GROUPS.map(async (group) => {
        const raw = await inventoryApi.list({ status: group.status, page: 1, page_size: 1 });
        return [group.status, readPage(raw).total];
      })),
      inventoryApi.list({ page: 1, page_size: 1 }),
    ]);
    return {
      statusCounts: Object.fromEntries(statusRows),
      total: readPage(allUnits).total,
    };
  }, [], { interval: 60000 });
  const facilities = useAsync(() => facilitiesApi.list(), []);
  const activity = useAsync(
    () => (facilityId
      ? facilitiesApi.audit(facilityId, {
        limit: 7,
        from: nairobiStart(ACTIVITY_WINDOWS.find((option) => option.id === activityWindow)?.daysAgo || 0),
      })
      : Promise.resolve(null)),
    [facilityId, activityWindow],
    { interval: 60000 },
  );

  const alertsList = Array.isArray(alerts.data) ? alerts.data : [];
  const suggestedList = Array.isArray(suggested.data) ? suggested.data : [];
  const openList = Array.isArray(open.data) ? open.data : [];
  const incomingList = Array.isArray(incoming.data) ? incoming.data : [];
  const pendingOfferCount = incomingList.filter((offer) => offer.status === 'pending').length;
  const heldOfferCount = incomingList.filter((offer) => offer.status === 'held').length;
  const offersToAnswer = incomingList.filter((offer) => ['pending', 'held'].includes(offer.status));
  const offerBreakdown = [
    pendingOfferCount ? `${pendingOfferCount} pending` : '',
    heldOfferCount ? `${heldOfferCount} held` : '',
  ].filter(Boolean).join(' · ');
  const transferPage = transfers.data ? readPage(transfers.data) : null;
  const transferItems = transferPage?.items || [];
  const facilitiesById = Object.fromEntries(
    (Array.isArray(facilities.data) ? facilities.data : []).map((row) => [row.id, row]),
  );

  const alertCounts = alertsList.reduce((acc, alert) => {
    const key = severityKey(alert);
    acc[key] += 1;
    return acc;
  }, { critical: 0, warning: 0, info: 0 });

  const today = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi', day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date());

  const kpis = [
    {
      to: '/forecast',
      label: 'Open alerts',
      value: alerts.data ? alertsList.length : undefined,
      loading: alerts.loading,
      error: alerts.error,
      tone: 'crimson',
      icon: BellRing,
      context: alerts.loading
        ? 'Loading live alerts'
        : alerts.error
          ? 'Alerts unavailable right now'
          : alertsList.length
            ? `${alertCounts.critical} critical · ${alertCounts.warning} warning`
            : 'No shortage alerts open',
    },
    {
      to: '/forecast',
      label: 'Suggested requests',
      value: Array.isArray(suggested.data) ? suggestedList.length : undefined,
      loading: suggested.loading,
      error: suggested.error,
      tone: 'amber',
      icon: Sparkles,
      context: suggested.loading
        ? 'Loading suggestions'
        : suggested.error
          ? 'Suggestions unavailable right now'
          : suggestedList.length
            ? `${suggestedList.length} awaiting review`
            : 'No suggestions waiting',
    },
    {
      to: '/requests',
      label: 'Open requests',
      value: Array.isArray(open.data) ? openList.length : undefined,
      loading: open.loading,
      error: open.error,
      tone: 'navy',
      icon: ClipboardList,
      context: open.loading
        ? 'Loading requests'
        : open.error
          ? 'Requests unavailable right now'
          : openList.length
            ? `${openList.length} confirmed and open`
            : 'No confirmed requests open',
    },
    {
      to: '/offers',
      label: 'Offers to answer',
      value: incoming.data ? offersToAnswer.length : undefined,
      loading: incoming.loading,
      error: incoming.error,
      tone: 'teal',
      icon: Inbox,
      context: incoming.loading
        ? 'Loading donor offers'
        : incoming.error
          ? 'Offers unavailable right now'
          : offersToAnswer.length
            ? offerBreakdown || `${offersToAnswer.length} awaiting reply`
            : 'No offers awaiting reply',
    },
    {
      to: '/transfers',
      label: 'Active transfers',
      value: transferPage ? transferPage.total : undefined,
      loading: transfers.loading,
      error: transfers.error,
      tone: 'slate',
      icon: Truck,
      context: transfers.loading
        ? 'Loading transfers'
        : transfers.error
          ? 'Transfers unavailable right now'
          : transferPage?.total
            ? `${transferPage.total} in progress${transferPage.total > transferItems.length ? ` · ${transferItems.length} shown` : ''}`
            : 'No active transfers',
    },
  ];

  const attentionItems = buildAttentionItems({
    alerts: alertsList,
    suggested: suggestedList,
    offers: offersToAnswer,
    transfers: transferItems,
    facilityId,
  });

  return (
    <div className="dashboard-page space-y-5 sm:space-y-6">
      <section aria-labelledby="overview-title" className="dashboard-enter flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clinic-teal">Facility overview</p>
          <h1 id="overview-title" className="mt-1.5 text-2xl font-semibold tracking-tight text-clinic-navy sm:text-[28px]">
            Hospital overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Monitor facility resources, operational alerts and ongoing workflows.
          </p>
        </div>
        <dl className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {facility?.name && (
            <div className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-clinic-border bg-bg-surface px-3 shadow-card">
              <Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              <dt className="sr-only">Facility</dt>
              <dd className="truncate font-semibold text-slate-700">
                {facility.name}
                {facility.county && <span className="font-normal text-slate-400"> · {facility.county}</span>}
              </dd>
            </div>
          )}
          <div className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-clinic-border bg-bg-surface px-3 shadow-card">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden />
            <dt className="sr-only">Reporting date</dt>
            <dd className="tabular-nums">Reporting as of {today}</dd>
          </div>
          <div
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/70 px-2.5 text-emerald-text"
            title="Dashboard metrics refresh automatically while this tab is active"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-status-emerald" aria-hidden />
            <dt className="sr-only">Refresh status</dt>
            <dd className="font-semibold">Live operations</dd>
          </div>
        </dl>

        <nav
          aria-label="Jump to dashboard sections"
          className="mt-1 flex w-full flex-wrap items-center gap-1 rounded-xl border border-clinic-border/80 bg-bg-surface/80 p-1.5 shadow-card"
        >
          <span className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Jump to</span>
          {DASHBOARD_SECTIONS.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-clinic-teal-soft hover:text-clinic-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </section>

      <section id="operational-metrics" aria-label="Key operational metrics" className="dashboard-enter dashboard-enter-2 grid scroll-mt-24 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        {kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
      </section>

      <div className="dashboard-enter dashboard-enter-3">
        <AttentionPanel
          items={attentionItems}
          loading={alerts.loading || suggested.loading || incoming.loading || transfers.loading}
          hasError={Boolean(alerts.error || suggested.error || incoming.error || transfers.error)}
        />
      </div>

      <div className="dashboard-enter dashboard-enter-4 grid gap-5 xl:grid-cols-12">
        <SectionCard
          id="priority-attention"
          className="xl:col-span-7"
          title="Priority attention"
          description={
            alertsList.length
              ? `${alertsList.length} open shortage alert${alertsList.length === 1 ? '' : 's'} for ${facility?.name || 'this facility'}`
              : 'Open blood-shortage alerts for this facility'
          }
          action={<ViewAll to="/forecast">View all alerts</ViewAll>}
        >
          <AlertsPanel
            alertsList={alertsList}
            loading={alerts.loading}
            error={alerts.error}
            facility={facility}
            onRetry={alerts.reload}
          />
        </SectionCard>

        <SectionCard
          id="inventory-intelligence"
          className="xl:col-span-5"
          title="Inventory intelligence"
          description="Unit distribution by current status"
          action={<ViewAll to="/inventory">Inventory</ViewAll>}
        >
          <InventoryPanel
            data={inventory.data}
            loading={inventory.loading}
            error={inventory.error}
            onRetry={inventory.reload}
          />
        </SectionCard>
      </div>

      <div className="dashboard-enter dashboard-enter-5 grid gap-5 xl:grid-cols-12">
        <SectionCard
          id="recent-activity"
          className="xl:col-span-7"
          title="Recent operational activity"
          description="Latest audited events for this facility"
          action={<ViewAll to="/audit">Audit trail</ViewAll>}
        >
          <ActivityPanel
            result={activity.data}
            loading={activity.loading}
            error={activity.error}
            windowId={activityWindow}
            onWindow={setActivityWindow}
            onRetry={activity.reload}
          />
        </SectionCard>

        <div className="flex flex-col gap-5 xl:col-span-5">
          <SectionCard
            id="active-transfers"
            title="Active transfers"
            description={
              transferPage && transferPage.total > transferItems.length
                ? `Latest ${transferItems.length} of ${transferPage.total} active transfers`
                : 'Transfers where this facility is a party'
            }
            action={<ViewAll to="/transfers">All transfers</ViewAll>}
          >
            <TransfersPanel
              items={transferPage ? transferItems : undefined}
              loading={transfers.loading}
              error={transfers.error}
              facilityId={facilityId}
              facility={facility}
              facilitiesById={facilitiesById}
              onRetry={transfers.reload}
            />
          </SectionCard>

          <SectionCard title="Quick actions" description="Common operational tasks">
            <QuickActions />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
