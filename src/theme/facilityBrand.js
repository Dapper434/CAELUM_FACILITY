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

/** MFL code -> brand. Codes 90001-90012 are the extended seed's placeholders. */
export const FACILITY_BRANDS = {
  12345: F('Mama Lucy Kibaki Hospital', 'nairobi', { logo: mamaLucyLogo, banner: mamaLucyBanner }),
  13023: F('Nairobi Hospital Hub', 'nairobi', { logo: nairobiLogo }),
  10603: F('Kiambu Level 5 Hospital', 'nairobi', { code: 'KL5' }),
  15340: F('Nakuru Level 5 Hospital', 'south_rift', { code: 'NL5' }),
  90001: F('Kenyatta National Hospital', 'nairobi', { logo: knhLogo, banner: knhBanner }),
  90002: F('Mbagathi County Hospital', 'nairobi', { logo: mbagathiLogo, banner: mbagathiBanner, nameInLogo: true }),
  90003: F('Thika Level 5 Hospital', 'nairobi', { code: 'TL5' }),
  90004: F('Machakos Level 5 Hospital', 'nairobi', { code: 'ML5' }),
  90005: F('Naivasha County Referral Hospital', 'south_rift', { code: 'NCR' }),
  90006: F('Narok County Referral Hospital', 'south_rift', { code: 'NRK' }),
  90007: F('Moi Teaching and Referral Hospital', 'north_rift', { logo: mtrhLogo, banner: mtrhBanner }),
  90008: F('Kapsabet County Referral Hospital', 'north_rift', { code: 'KPS' }),
  90009: F('Coast General Teaching and Referral Hospital', 'coast', { logo: cgtrhLogo, banner: cgtrhBanner }),
  90010: F('Port Reitz Sub-County Hospital', 'coast', { code: 'PRZ' }),
  90011: F('Jaramogi Oginga Odinga Teaching and Referral Hospital', 'nyanza', { logo: jootrhLogo, banner: jootrhBanner }),
  90012: F('Kisumu County Referral Hospital', 'nyanza', { logo: kcrhLogo }),
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
