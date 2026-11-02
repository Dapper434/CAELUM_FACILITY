import React from 'react';
import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="card max-w-md p-6">
      <h1 className="text-xl font-extrabold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500 mt-1">There is no screen at this address.</p>
      <Link to="/" className="inline-block mt-4 text-sm font-semibold text-brand-cobalt">Back to overview</Link>
    </div>
  );
}
