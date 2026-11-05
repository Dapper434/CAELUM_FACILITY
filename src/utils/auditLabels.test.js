import { describe, expect, it } from 'vitest';
import { actionLabel, groupConsecutive, isImportantAction } from './auditLabels';

describe('auditLabels', () => {
  it('labels and flags important actions', () => {
    expect(actionLabel('transfer.courier_timeout')).toBe('Courier did not accept in time');
    expect(isImportantAction('transfer.courier_timeout')).toBe(true);
    expect(isImportantAction('request.created')).toBe(false);
  });

  it('groups three or more consecutive repeats', () => {
    const rows = [
      { seq: 3, action: 'request.cancelled' },
      { seq: 2, action: 'request.cancelled' },
      { seq: 1, action: 'request.cancelled' },
    ];
    expect(groupConsecutive(rows)[0]).toMatchObject({ kind: 'group', count: 3 });
  });
});
