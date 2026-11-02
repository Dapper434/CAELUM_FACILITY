import { describe, expect, it } from 'vitest';
import { toRequestPayload } from '../components/NewRequestForm';
import { toUnitPayload } from '../components/AddUnitsForm';
import { mergeAudit } from './AuditPage';

describe('request payload', () => {
  it('drops empty optional fields and casts units', () => {
    expect(toRequestPayload({ blood_group: 'O-', units_requested: '3', product_type: 'packed_rbc', urgency: 'emergency', reason: ' PPH ', patient_ref: '', needed_by: '' }))
      .toEqual({ blood_group: 'O-', units_requested: 3, product_type: 'packed_rbc', urgency: 'emergency', reason: 'PPH' });
  });
});

describe('unit payload', () => {
  it('converts expiry to ISO and temp to a number', () => {
    const u = toUnitPayload({ unit_code: ' U1 ', lot_number: 'L1', blood_group: 'A+', product_type: 'plasma', expiry_date: '2026-11-10T08:00Z', storage_temp_c: '-30' });
    expect(u).toEqual({ unit_code: 'U1', lot_number: 'L1', blood_group: 'A+', product_type: 'plasma', expiry_date: '2026-11-10T08:00:00.000Z', storage_temp_c: -30 });
    expect(toUnitPayload({ unit_code: 'U', lot_number: 'L', blood_group: 'O+', product_type: 'packed_rbc', expiry_date: '2026-11-10T08:00Z', storage_temp_c: '' })).not.toHaveProperty('storage_temp_c');
  });
});

describe('mergeAudit', () => {
  it('dedupes by seq and sorts newest first', () => {
    const merged = mergeAudit([
      { transfer: { transfer_code: 'TRF-1' }, entries: [{ seq: 1 }, { seq: 3 }] },
      { transfer: { transfer_code: 'TRF-2' }, entries: [{ seq: 2 }, { seq: 3 }] },
    ]);
    expect(merged.map((e) => e.seq)).toEqual([3, 2, 1]);
    expect(merged[1].transfer_code).toBe('TRF-2');
  });
});
