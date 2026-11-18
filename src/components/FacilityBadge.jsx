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
  // Full-colour mark on the dark sign-in panel: logo on a white tile, badge in the accent with a white ring.
  panel: { tile: 'text-white ring-2 ring-white/90', name: 'text-white', logoWrap: 'bg-white rounded-2xl p-2 shadow-md' },
};

// `box` sizes give the logo a fixed square tile (crest fitted inside); the others size the logo by height.
const SIZES = {
  sm: { mark: 'h-9', tile: 'h-9 min-w-9 text-xs', name: 'text-sm' },
  md: { mark: 'h-12', tile: 'h-12 min-w-12 text-sm', name: 'text-sm' },
  lg: { mark: 'h-16', tile: 'h-16 min-w-16 text-lg', name: 'text-lg' },
  xl: { box: 'w-[72px] h-[72px]', tile: 'w-[72px] h-[72px] rounded-2xl text-xl', name: 'text-xl lg:text-2xl' },
};

/**
 * A facility's mark: its official logo when it has one, otherwise a neutral CAELUM initials badge.
 * Never pass a county emblem as `logo` (Facility logo rule, 02_DESIGN_SYSTEM.md).
 */
export default function FacilityBadge({
  name, code, logo, tone = 'accent', accent, size = 'md', showName = true, logoLoading = 'lazy', logoAlt, className = '',
}) {
  const t = TONES[tone] || TONES.accent;
  const z = SIZES[size] || SIZES.md;
  const img = logo && (
    <img src={logo} alt={logoAlt ?? (showName ? '' : name)} loading={logoLoading} decoding="async"
      className={z.box ? 'max-w-full max-h-full object-contain' : `${z.mark} w-auto max-w-[12rem] object-contain shrink-0`} />
  );
  const wrap = z.box ? `${z.box} items-center justify-center` : '';
  const mark = logo ? (t.logoWrap ? <span className={`shrink-0 inline-flex ${wrap} ${t.logoWrap}`}>{img}</span> : img) : (
    <span
      aria-hidden={showName ? 'true' : undefined}
      aria-label={showName ? undefined : name}
      role={showName ? undefined : 'img'}
      className={`${z.tile} px-1.5 shrink-0 ${z.box ? '' : 'rounded-xl'} inline-flex items-center justify-center font-extrabold tracking-wide ${t.tile}`}
      style={tone === 'onDark' ? undefined : { backgroundColor: accent || 'var(--caelum-navy)' }}
    >
      {code || facilityInitials(name)}
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {mark}
      {showName && <span className={`${z.name} font-semibold leading-tight ${t.name}`}>{name}</span>}
    </span>
  );
}
