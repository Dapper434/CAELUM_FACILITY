import { describe, expect, it } from 'vitest';
import { formatCountdown, formatDateTime, formatEta, formatTemp, humanize, msUntil } from './format';

describe('format helpers', () => {
  it('renders times in Nairobi', () => {
    expect(formatDateTime('2026-11-03T14:30:00Z')).toBe('03 Nov, 17:30 EAT');
    expect(formatDateTime(null)).toBe('—');
  });
  it('formats countdowns', () => {
    expect(formatCountdown(299_000)).toBe('04:59');
    expect(formatCountdown(1_800_000)).toBe('30:00');
    expect(formatCountdown(3_725_000)).toBe('1:02:05');
    expect(formatCountdown(-5)).toBe('00:00');
  });
  it('never returns negative remaining time', () => {
    expect(msUntil('2026-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:10Z'))).toBe(0);
    expect(msUntil('2026-01-01T00:01:00Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(60_000);
  });
  it('labels estimated ETAs', () => {
    expect(formatEta(38, 'estimate')).toBe('38 min (estimate)');
    expect(formatEta(18.4, 'osrm')).toBe('18 min');
    expect(formatEta(null)).toBe('—');
  });
  it('formats temperatures and labels', () => {
    expect(formatTemp(4)).toBe('4.0 °C');
    expect(humanize('in_transit')).toBe('In transit');
  });
});
