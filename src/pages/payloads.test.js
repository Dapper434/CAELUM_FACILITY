import { describe, expect, it } from 'vitest';
import { toRequestPayload } from '../components/NewRequestForm';
import { toUnitPayload } from '../components/AddUnitsForm';
import { appendPage } from './AuditPage';

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

describe('appendPage', () => {
  it('dedupes by seq and keeps newest first', () => {
    const merged = appendPage([{ seq: 9 }, { seq: 7 }], [{ seq: 7 }, { seq: 5 }, { seq: 6 }]);
    expect(merged.map((e) => e.seq)).toEqual([9, 7, 6, 5]);
  });
});

import { toCorrectionPayload } from '../components/CorrectUnitForm';

describe('correction payload', () => {
  const unit = { lot_number: 'L1', expiry_date: null, storage_temp_c: 4 };
  it('sends only changed fields with the reason', () => {
    expect(toCorrectionPayload(unit, { lot_number: 'L2', expiry_date: '', storage_temp_c: 4, reason: ' typo ' }))
      .toEqual({ lot_number: 'L2', reason: 'typo' });
    expect(toCorrectionPayload(unit, { lot_number: 'L1', expiry_date: '', storage_temp_c: '', reason: 'probe' }))
      .toEqual({ storage_temp_c: null, reason: 'probe' });
  });
  it('returns null when nothing changed', () => {
    expect(toCorrectionPayload(unit, { lot_number: 'L1', expiry_date: '', storage_temp_c: '4', reason: 'x' })).toBeNull();
  });
});
