import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-cobalt text-white hover:bg-brand-navy',
  danger: 'bg-brand-burgundy text-white hover:bg-brand-burgundy-hover',
  success: 'bg-status-emerald text-white hover:opacity-90',
  ghost: 'bg-bg-inset border border-border-warm text-slate-800 hover:border-brand-burgundy/40',
};

export function Button({ variant = 'primary', busy, children, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`card p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 mb-3">
          {title && <h2 className="text-sm font-bold text-slate-900">{title}</h2>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-status-crimson/30 bg-brand-burgundy-light px-3 py-2 text-sm text-brand-burgundy mb-3">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{error.message}{error.code && error.code !== 'http_error' ? ` (${error.code})` : ''}</span>
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
      <Loader2 className="w-4 h-4 animate-spin" /> {label}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="text-sm text-slate-500 py-4">{children}</p>;
}
