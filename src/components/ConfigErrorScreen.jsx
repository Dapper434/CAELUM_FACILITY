import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfigErrorScreen({ errors }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div role="alert" className="card max-w-lg w-full p-6">
        <div className="flex items-center gap-2 text-brand-burgundy font-extrabold mb-2">
          <AlertTriangle className="w-5 h-5" /> CAELUM Facility is not configured
        </div>
        <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
        <p className="text-xs text-slate-500 mt-3">Set the variables in <code>.env</code> (local) or the hosting provider&apos;s environment, then rebuild.</p>
      </div>
    </div>
  );
}
