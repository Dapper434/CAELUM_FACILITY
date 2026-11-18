import { describe, expect, it } from 'vitest';
import { FACILITY_BRANDS, REGION_ACCENT, brandFor } from './facilityBrand';

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

describe('facility brand table', () => {
  it('covers the 16 seeded hospitals: 8 official logos, 8 initials badges, 6 banners', () => {
    const all = Object.values(FACILITY_BRANDS);
    expect(all).toHaveLength(16);
    expect(all.filter((b) => b.logo)).toHaveLength(8);
    expect(all.filter((b) => !b.logo && b.code)).toHaveLength(8);
    expect(all.filter((b) => b.banner)).toHaveLength(6);
    expect(new Set(all.map((b) => b.code).filter(Boolean)).size).toBe(8);
  });

  it('keeps white text at 4.5:1 or better on every accent', () => {
    Object.values(REGION_ACCENT).forEach((hex) => expect(contrast(hex, '#FFFFFF')).toBeGreaterThanOrEqual(4.5));
  });

  it('prefers API logo/banner fields, then the local table, else null', () => {
    expect(brandFor('90001')).toMatchObject({ name: 'Kenyatta National Hospital', mfl: '90001' });
    expect(brandFor({ mfl_code: '90003', name: 'Thika Level 5 Hospital', logo: '/api-logo.webp' })).toMatchObject({ logo: '/api-logo.webp', code: 'TL5' });
    expect(brandFor({ mfl_code: '1', name: 'New Hospital', region_code: 'coast' })).toMatchObject({ name: 'New Hospital', logo: null, banner: null, accent: REGION_ACCENT.coast });
    expect(brandFor('nope')).toBeNull();
    expect(brandFor(null)).toBeNull();
  });
});
