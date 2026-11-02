import { describe, expect, it } from 'vitest';
import { lineStringToLatLngs, hasCoords } from './geo';
import { isExcursion } from './temperature';
import { parseQrPayload, sealMatches } from './custody';

describe('geo', () => {
  it('flips GeoJSON lng/lat for Leaflet', () => {
    expect(lineStringToLatLngs({ type: 'LineString', coordinates: [[36.82, -1.29], [36.9, -1.27]] })).toEqual([[-1.29, 36.82], [-1.27, 36.9]]);
    expect(lineStringToLatLngs(null)).toEqual([]);
    expect(hasCoords({ latitude: -1, longitude: 36 })).toBe(true);
    expect(hasCoords({ latitude: null, longitude: 36 })).toBe(false);
  });
});

describe('temperature', () => {
  it('uses product bands', () => {
    expect(isExcursion(4, 'packed_rbc')).toBe(false);
    expect(isExcursion(7.1, 'packed_rbc')).toBe(true);
    expect(isExcursion(22, 'platelets')).toBe(false);
    expect(isExcursion(-10, 'plasma')).toBe(true);
  });
  it('trusts the server flag when present', () => {
    expect(isExcursion(4, 'packed_rbc', { excursion: true })).toBe(true);
  });
});

describe('custody', () => {
  it('compares seals ignoring case and spaces', () => {
    expect(sealMatches('SEAL-0042', ' seal-0042 ')).toBe(true);
    expect(sealMatches('SEAL-0042', 'SEAL-0043')).toBe(false);
    expect(sealMatches('', '')).toBe(false);
  });
  it('parses QR payloads', () => {
    const p = parseQrPayload('caelum:v1:abc:SEAL-1:1767225600:deadbeef');
    expect(p.transferId).toBe('abc');
    expect(p.seal).toBe('SEAL-1');
    expect(p.expiresAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(parseQrPayload('nope')).toBeNull();
  });
});
