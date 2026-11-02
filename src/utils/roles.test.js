import { describe, expect, it } from 'vitest';
import { transferRole } from './roles';

const t = { donor_facility_id: 'd', recipient_facility_id: 'r' };

describe('transferRole', () => {
  it('matches donor and recipient', () => {
    expect(transferRole(t, 'd')).toBe('donor');
    expect(transferRole(t, 'r')).toBe('recipient');
  });
  it('fails closed when unknown', () => {
    expect(transferRole(t, 'x')).toBeNull();
    expect(transferRole(t, null)).toBeNull();
    expect(transferRole(null, 'd')).toBeNull();
  });
});
