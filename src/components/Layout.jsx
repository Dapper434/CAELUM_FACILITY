import React from 'react';
import { NavLink, Outlet } from 'react-router';
import {
  LayoutDashboard, Droplets, Search, TrendingUp, ClipboardList, Inbox, Truck, ShieldCheck, Settings, LogOut,
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

export default function Layout() {
  const { me, facility, signOut, error } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 bg-bg-surface border-b border-border-warm flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold">C</span>
          <div>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight">CAELUM Facility</div>
            <div className="text-[11px] text-slate-500">{facility ? `${facility.name} · ${facility.level_label || ''}` : me?.email || ''}</div>
          </div>
        </div>
        <button type="button" onClick={signOut} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-burgundy">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>
      <div className="flex flex-col md:flex-row flex-1">
        <aside className="w-full md:w-60 bg-bg-surface border-b md:border-b-0 md:border-r border-border-warm p-3">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2 mb-2">Hospital operations</div>
          <nav className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-1.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border overflow-hidden ${
                  isActive
                    ? 'bg-brand-cobalt text-white border-brand-cobalt'
                    : 'bg-bg-inset border-border-warm text-slate-800 hover:border-brand-burgundy/40'
                }`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 inset-y-0 w-1 bg-brand-burgundy" />}
                    <Icon className={`w-4 h-4 ${isActive ? 'text-accent-yellow' : 'text-slate-400'}`} />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full">
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
