/** 'donor' | 'recipient' | null. Null (unknown) must hide role-specific actions. */
export function transferRole(transfer, facilityId) {
  if (!transfer || !facilityId) return null;
  if (transfer.donor_facility_id === facilityId) return 'donor';
  if (transfer.recipient_facility_id === facilityId) return 'recipient';
  return null;
}
