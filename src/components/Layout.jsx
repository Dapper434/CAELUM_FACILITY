import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { RouteErrorBoundary } from './ErrorBoundary';
import {
  LayoutDashboard, Droplets, Search, TrendingUp, ClipboardList, Inbox, Truck, ShieldCheck, Settings,
  LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronDown, Building2, Hash, MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from './ui';
import BrandMark from './BrandMark';

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Inventory', icon: Droplets },
  { to: '/availability', label: 'Availability', icon: Search },
  { to: '/forecast', label: 'Forecast & alerts', icon: TrendingUp },
  { to: '/requests', label: 'Requests', icon: ClipboardList },
  { to: '/offers', label: 'Donor offers', icon: Inbox },
  { to: '/transfers', label: 'Transfers', icon: Truck },
  { to: '/audit', label: 'Audit trail', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const GROUP_DEFS = [
  { label: 'Workspace', routes: ['/', '/inventory', '/availability', '/forecast'] },
  { label: 'Transactions', routes: ['/requests', '/offers', '/transfers'] },
  { label: 'Governance', routes: ['/audit', '/settings'] },
];

/** Navigation grouped by workflow, in the same order as NAV_ITEMS. */
export const NAV_GROUPS = GROUP_DEFS.map((group) => ({
  label: group.label,
  items: group.routes.map((to) => NAV_ITEMS.find((item) => item.to === to)).filter(Boolean),
}));

const SIDEBAR_KEY = 'caelum.facility.sidebar.collapsed';

function readCollapsed() {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    if (stored === '1' || stored === '0') return stored === '1';
  } catch { /* storage can be unavailable */ }
  return typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth < 1280 : false;
}

function NavItem({ item, collapsed, onNavigate }) {
  const { to, label, icon: Icon, end } = item;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={({ isActive }) => [
        'group relative flex min-h-10 items-center gap-2.5 rounded-lg text-[13px] font-semibold transition-colors',
        collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-2',
        isActive
          ? 'bg-clinic-teal-soft text-clinic-navy'
          : 'text-slate-600 hover:bg-bg-inset hover:text-slate-900',
      ].join(' ')}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-clinic-teal" aria-hidden />
          )}
          <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-clinic-teal' : 'text-slate-500'}`} aria-hidden />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
          {collapsed && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-clinic-navy px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block group-focus-visible:block"
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavList({ onNavigate, id, collapsed = false }) {
  return (
    <nav id={id} className="flex flex-1 flex-col gap-0.5" aria-label="Hospital operations">
      {NAV_GROUPS.map((group, index) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          {collapsed ? (
            index > 0 && <div className="mx-2 my-2 border-t border-border-warm" aria-hidden />
          ) : (
            <div className={`px-2.5 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 ${index === 0 ? 'pt-1' : 'pt-4'}`}>
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { me, facility, signOut, error } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const location = useLocation();
  const panelId = useId();
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const initial = (me?.email || '?').charAt(0).toUpperCase();

  // Close both menus after any route change (including the link that opened a page).
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onPointerDown = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      try { window.localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0'); } catch { /* storage can be unavailable */ }
      return next;
    });
  }

  return (
    <div className="app-canvas app-shell flex h-screen flex-col overflow-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-clinic-navy px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 h-16 border-b border-clinic-border bg-bg-surface backdrop-blur">
        <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-clinic-border bg-bg-surface text-slate-700 md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls={panelId}
              onClick={() => { setAccountOpen(false); setMenuOpen((v) => !v); }}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
            <BrandMark className="h-9 w-9 shrink-0 text-sm" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-tight text-clinic-navy">
                CAELUM <span className="font-semibold text-slate-500">Facility</span>
              </div>
              <div className="truncate text-xs text-slate-500">
                {facility ? `${facility.name}${facility.county ? ` · ${facility.county}` : ''}` : me?.email || 'Hospital operations'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="hidden items-center gap-2 border-r border-clinic-border pr-3 sm:flex"
              title="Operational data refreshes automatically while this tab is active"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-status-emerald/20" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-emerald" />
              </span>
              <span className="text-xs font-semibold text-slate-600">Live data</span>
            </div>

            <div className="relative" ref={accountRef}>
              <button
                ref={accountButtonRef}
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label={`Account menu for ${me?.email || 'facility account'}`}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-controls="facility-account-menu"
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal focus-visible:ring-offset-2 ${
                  accountOpen
                    ? 'border-clinic-teal/40 bg-clinic-teal-soft'
                    : 'border-clinic-border bg-bg-surface hover:border-clinic-teal/40 hover:bg-bg-inset'
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-clinic-navy text-xs font-bold text-white">
                  {initial}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-150 ${accountOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {accountOpen && (
                <div
                  id="facility-account-menu"
                  role="group"
                  aria-label="Account details"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-clinic-border bg-bg-surface shadow-xl"
                >
                  <div className="border-b border-clinic-border px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-clinic-navy text-sm font-bold text-white">
                        {initial}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-semibold text-slate-900">{me?.email || 'Facility account'}</p>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Facility account</p>
                      </div>
                    </div>

                    {facility && (
                      <dl className="mt-3 space-y-1.5 rounded-lg border border-clinic-border/80 bg-bg-inset px-3 py-2.5 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                          <div className="min-w-0">
                            <dt className="sr-only">Active facility</dt>
                            <dd className="truncate font-semibold text-slate-800">{facility.name}</dd>
                          </div>
                        </div>
                        {facility.county && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                            <dt className="sr-only">County</dt>
                            <dd className="truncate">{facility.county}</dd>
                          </div>
                        )}
                        {facility.mfl_code && (
                          <div className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                            <dt className="sr-only">Facility identifier</dt>
                            <dd className="font-mono tabular-nums">MFL {facility.mfl_code}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </div>

                  <div className="p-1.5" role="menu" aria-label="Account actions">
                    <Link
                      to="/settings"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-bg-inset hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
                    >
                      <Settings className="h-4 w-4 text-slate-400" aria-hidden />
                      Account settings
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setAccountOpen(false); signOut(); }}
                      className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-crimson-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic-teal"
                    >
                      <LogOut className="h-4 w-4 text-slate-400" aria-hidden />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside id={panelId} className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-r border-clinic-border bg-bg-surface p-3 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <BrandMark className="h-8 w-8 text-xs" />
                <span className="text-sm font-extrabold tracking-tight text-clinic-navy">CAELUM Facility</span>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-bg-inset hover:text-slate-900"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavList onNavigate={() => setMenuOpen(false)} id={`${panelId}-nav`} />
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1">
        <aside
          className={`hidden h-full shrink-0 flex-col border-r border-clinic-border bg-bg-surface transition-[width] duration-[250ms] ease-out motion-reduce:transition-none md:flex ${
            collapsed ? 'w-[68px]' : 'w-[240px]'
          }`}
        >
          <div className="sidebar-scroll flex-1 overflow-y-auto px-2 py-3">
            <NavList id="desktop-nav" collapsed={collapsed} />
          </div>
          <div className="border-t border-clinic-border p-2">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand sidebar' : undefined}
              className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg text-xs font-semibold text-slate-500 transition-colors hover:bg-bg-inset hover:text-slate-800 ${
                collapsed ? 'justify-center px-0' : 'px-2.5'
              }`}
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden /> : (
                <>
                  <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden />
                  <span>Collapse menu</span>
                </>
              )}
            </button>
          </div>
        </aside>

        <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="page-outlet mx-auto flex min-h-0 w-full max-w-[1500px] flex-1 flex-col overflow-y-auto">
            {error && <ErrorBanner error={error} />}
            {me && me.role !== 'facility' && (
              <ErrorBanner error={{ message: `Signed in as ${me.role}. This app is for facility accounts.` }} />
            )}
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
