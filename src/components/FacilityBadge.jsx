import React from 'react';

const SKIP_WORDS = new Set(['and', 'of', 'the', 'hospital']);

/**
 * Short code for a facility with no official logo, e.g. "Thika Level 5 Hospital" -> "TL5".
 * "Level N" collapses to "LN"; "and", "of", "the" and "Hospital" are skipped. Max 4 characters.
 */
export function facilityInitials(name = '') {
  const words = String(name).replace(/[^A-Za-z0-9\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
  let out = '';
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (/^level$/i.test(w) && /^\d+$/.test(words[i + 1] || '')) {
      out += `L${words[i + 1]}`;
      i += 1;
    } else if (!SKIP_WORDS.has(w.toLowerCase())) {
      out += w[0].toUpperCase();
    }
  }
  return out.slice(0, 4) || 'C';
}

const TONES = {
  // Solid tile in the facility accent (defaults to CAELUM navy). White text keeps 4.5:1 on every CAELUM brand fill.
  accent: { tile: 'text-white', name: 'text-slate-900' },
  // Monochrome white on a dark band (landing page marquee).
  onDark: { tile: 'border-2 border-white/80 text-white', name: 'text-white' },
};

/**
 * A facility's mark: its official logo when it has one, otherwise a neutral CAELUM initials badge.
 * Never pass a county emblem as `logo` (Facility logo rule, 02_DESIGN_SYSTEM.md).
 */
export default function FacilityBadge({
  name, code, logo, tone = 'accent', accent, showName = true, logoLoading = 'lazy', className = '',
}) {
  const t = TONES[tone] || TONES.accent;
  const mark = logo ? (
    <img src={logo} alt={showName ? '' : name} loading={logoLoading} decoding="async" className="h-12 w-auto max-w-[9rem] object-contain shrink-0" />
  ) : (
    <span
      aria-hidden={showName ? 'true' : undefined}
      aria-label={showName ? undefined : name}
      role={showName ? undefined : 'img'}
      className={`h-12 min-w-12 px-1.5 shrink-0 rounded-xl inline-flex items-center justify-center text-sm font-extrabold tracking-wide ${t.tile}`}
      style={tone === 'accent' ? { backgroundColor: accent || 'var(--caelum-navy)' } : undefined}
    >
      {code || facilityInitials(name)}
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      {showName && <span className={`text-sm font-semibold leading-tight ${t.name}`}>{name}</span>}
    </span>
  );
}
