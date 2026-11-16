import React from 'react';
import { useLocation } from 'react-router';

/**
 * Catches render errors and shows a calm fallback. Does not log tokens or app state.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('CAELUM Facility: a screen failed to render.', error?.message || String(error), info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" className="max-w-md mx-auto my-8 p-6 card space-y-3">
        <h1 className="text-lg font-extrabold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-600">This page could not be shown. Try reloading, or go to another page.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl bg-brand-cobalt text-white px-3 py-2 text-sm font-semibold"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          {this.props.home !== false && (
            <a href="/" className="rounded-xl bg-bg-inset border border-border-warm px-3 py-2 text-sm font-semibold text-slate-800">
              Go to dashboard
            </a>
          )}
        </div>
      </div>
    );
  }
}

/** Remounts the boundary when the route changes so a failed page does not stick after navigation. */
export function RouteErrorBoundary({ children, home }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname} home={home}>{children}</ErrorBoundary>;
}
