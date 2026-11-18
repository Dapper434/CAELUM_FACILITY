// Per-facility brand: logo, banner and accent, keyed by MFL code (stable across API seeds).
// The facilities API has no logo/banner/accent fields yet. `brandFor` reads optional `logo` and
// `banner` from a facility object first, then falls back to this local table, then to neutral CAELUM.
//
// Logo rule (02_DESIGN_SYSTEM.md, Kevin 17 Nov 2026): only the 8 hospitals with their own official
// logo get one. The other 8 have county emblems only; they get a FacilityBadge initials badge.
// Accent (Kevin, 17 Nov 2026: existing tokens only) follows the region, so hospitals that can
// transfer to each other share a colour. Every accent keeps white text above 4.5:1.
import knhLogo from '../assets/facilities/logos/knh.webp';
import mtrhLogo from '../assets/facilities/logos/mtrh.webp';
import nairobiLogo from '../assets/facilities/logos/nairobi-hospital.webp';
import mamaLucyLogo from '../assets/facilities/logos/mama-lucy.webp';
import mbagathiLogo from '../assets/facilities/logos/mbagathi.webp';
import cgtrhLogo from '../assets/facilities/logos/cgtrh.webp';
import jootrhLogo from '../assets/facilities/logos/jootrh.webp';
import kcrhLogo from '../assets/facilities/logos/kcrh.webp';
import knhBanner from '../assets/facilities/banners/knh.webp';
import mtrhBanner from '../assets/facilities/banners/mtrh.webp';
import mamaLucyBanner from '../assets/facilities/banners/mama-lucy.webp';
import mbagathiBanner from '../assets/facilities/banners/mbagathi.webp';
import cgtrhBanner from '../assets/facilities/banners/cgtrh.webp';
import jootrhBanner from '../assets/facilities/banners/jootrh.webp';
import tokens from './tokens.js';

export const REGION_ACCENT = {
  nairobi: tokens.cobalt,
  south_rift: tokens['emerald-text'],
  north_rift: tokens['amber-text'],
  coast: tokens.navy,
  nyanza: tokens.burgundy,
  western: tokens.navy,
};

const F = (name, region, extra = {}) => ({ name, region, ...extra });
/** The two staff accounts the extended seed creates per hospital (API/src/utils/seed_extended.py _users). */
const demo = (key) => [`${key}.bloodbank`, `${key}.lab`];

/** MFL code -> brand. Codes 90001-90012 are the extended seed's placeholders. */
export const FACILITY_BRANDS = {
  12345: F('Mama Lucy Kibaki Hospital', 'nairobi', { logo: mamaLucyLogo, banner: mamaLucyBanner, emailLocals: ['recipient'] }),
  13023: F('Nairobi Hospital Hub', 'nairobi', { logo: nairobiLogo, emailLocals: ['donor'] }),
  10603: F('Kiambu Level 5 Hospital', 'nairobi', { code: 'KL5' }),
  15340: F('Nakuru Level 5 Hospital', 'south_rift', { code: 'NL5' }),
  90001: F('Kenyatta National Hospital', 'nairobi', { logo: knhLogo, banner: knhBanner, emailLocals: demo('knh') }),
  90002: F('Mbagathi County Hospital', 'nairobi', { logo: mbagathiLogo, banner: mbagathiBanner, nameInLogo: true, emailLocals: demo('mbagathi') }),
  90003: F('Thika Level 5 Hospital', 'nairobi', { code: 'TL5', emailLocals: demo('thika') }),
  90004: F('Machakos Level 5 Hospital', 'nairobi', { code: 'ML5', emailLocals: demo('machakos') }),
  90005: F('Naivasha County Referral Hospital', 'south_rift', { code: 'NCR', emailLocals: demo('naivasha') }),
  90006: F('Narok County Referral Hospital', 'south_rift', { code: 'NRK', emailLocals: demo('narok') }),
  90007: F('Moi Teaching and Referral Hospital', 'north_rift', { logo: mtrhLogo, banner: mtrhBanner, emailLocals: demo('mtrh') }),
  90008: F('Kapsabet County Referral Hospital', 'north_rift', { code: 'KPS', emailLocals: demo('kapsabet') }),
  90009: F('Coast General Teaching and Referral Hospital', 'coast', { logo: cgtrhLogo, banner: cgtrhBanner, emailLocals: demo('cgtrh') }),
  90010: F('Port Reitz Sub-County Hospital', 'coast', { code: 'PRZ', emailLocals: demo('portreitz') }),
  90011: F('Jaramogi Oginga Odinga Teaching and Referral Hospital', 'nyanza', { logo: jootrhLogo, banner: jootrhBanner, emailLocals: demo('jootrh') }),
  90012: F('Kisumu County Referral Hospital', 'nyanza', { logo: kcrhLogo, emailLocals: demo('kcrh') }),
};

/**
 * Brand for a facility object ({mfl_code, name, region_code, logo?, banner?}) or a bare MFL code.
 * Returns null when nothing is known, so callers show the neutral CAELUM panel.
 */
export function brandFor(facility) {
  const f = facility && typeof facility === 'object' ? facility : { mfl_code: facility };
  const mfl = f.mfl_code == null ? '' : String(f.mfl_code).trim();
  const local = FACILITY_BRANDS[mfl];
  if (!local && !f.name) return null;
  const region = f.region_code || local?.region;
  return {
    mfl,
    name: f.name || local.name,
    code: local?.code,
    logo: f.logo || local?.logo || null,
    banner: f.banner || local?.banner || null,
    nameInLogo: Boolean(local?.nameInLogo && !f.logo),
    accent: REGION_ACCENT[region] || tokens.navy,
  };
}

// ---------- Email-first sign-in (Round 2 Task 2; Kevin: "Option A", 18 Nov 2026) ----------
// The app works the hospital out from the typed email itself and never asks the server, so it cannot reveal whether
// an account exists. Only the demo domain (and, later, real hospital domains listed in `domains`) is matched, so
// "knh.someone@gmail.com" does not pick up KNH branding.
export const DEMO_EMAIL_DOMAIN = 'caelum.demo';

/**
 * What a typed email looks like: { kind: 'facility', mfl } | { kind: 'admin' } | { kind: 'courier' } | null (unknown).
 * Demo accounts only, matched exactly: `<key>.bloodbank@caelum.demo` / `<key>.lab@caelum.demo` (key from the API seed), plus the older
 * `donor@` (Nairobi Hospital Hub) and `recipient@` (Mama Lucy Kibaki). Real domains: add `domains: ['knh.or.ke']` to an entry.
 */
export function classifyEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1 || at === e.length - 1) return null;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  for (const [mfl, b] of Object.entries(FACILITY_BRANDS)) {
    if ((b.domains || []).some((d) => domain === d || domain.endsWith(`.${d}`))) return { kind: 'facility', mfl };
  }
  if (domain !== DEMO_EMAIL_DOMAIN) return null;
  if (/^admin\d*$/.test(local)) return { kind: 'admin' };
  if (/^courier\d*$/.test(local)) return { kind: 'courier' };
  // Exact demo account names only, so "knh.anything@caelum.demo" stays neutral (security review, 18 Nov 2026).
  const hit = Object.entries(FACILITY_BRANDS).find(([, b]) => (b.emailLocals || []).includes(local));
  return hit ? { kind: 'facility', mfl: hit[0] } : null;
}

