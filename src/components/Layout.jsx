import React, { useEffect, useId, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard, Droplets, Search, TrendingUp, ClipboardList, Inbox, Truck, ShieldCheck, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBanner } from './ui';

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

function NavList({ onNavigate, id }) {
  return (
    <nav id={id} className="flex flex-col gap-1.5" aria-label="Hospital operations">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border overflow-hidden ${
            isActive
              ? 'bg-brand-cobalt text-white border-brand-cobalt'
              : 'bg-bg-inset border-border-warm text-slate-800 hover:border-brand-burgundy/40'
          }`}
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 inset-y-0 w-1 bg-brand-burgundy" aria-hidden />}
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-yellow' : 'text-slate-400'}`} aria-hidden />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { me, facility, signOut, error } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const panelId = useId();

  // Close the drawer after any route change (including the link that opened a page).
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <header className="h-14 sm:h-16 bg-bg-surface border-b border-border-warm flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border-warm bg-bg-inset text-slate-800"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls={panelId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
          </button>
          <span className="w-8 h-8 rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold shrink-0">C</span>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 tracking-tight truncate">CAELUM Facility</div>
            <div className="text-[11px] text-slate-500 truncate">{facility ? `${facility.name} · ${facility.level_label || ''}` : me?.email || ''}</div>
          </div>
        </div>
        <button type="button" onClick={signOut} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-burgundy shrink-0">
          <LogOut className="w-4 h-4" aria-hidden /> <span className="hidden xs:inline sm:inline">Sign out</span>
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside id={panelId} className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-bg-surface border-r border-border-warm shadow-xl p-4 overflow-y-auto">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-1 mb-3">Hospital operations</div>
            <NavList onNavigate={() => setMenuOpen(false)} id={`${panelId}-nav`} />
          </aside>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 min-w-0">
        <aside className="hidden md:block w-60 shrink-0 bg-bg-surface border-r border-border-warm p-3">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 mb-2">Hospital operations</div>
          <NavList id="desktop-nav" />
        </aside>
        <main className="flex-1 p-3 sm:p-6 max-w-6xl w-full min-w-0">
          {error && <ErrorBanner error={error} />}
          {me && me.role !== 'facility' && (
            <ErrorBanner error={{ message: `Signed in as ${me.role}. This app is for facility accounts.` }} />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
