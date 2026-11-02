export const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const PRODUCTS = [
  { value: 'packed_rbc', label: 'Packed RBC' },
  { value: 'platelets', label: 'Platelets' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'whole_blood', label: 'Whole blood' },
];

export const URGENCIES = ['routine', 'urgent', 'emergency'];

export const DECLINE_REASONS = [
  { value: 'insufficient_stock', label: 'Insufficient stock' },
  { value: 'reserved_locally', label: 'Reserved locally' },
  { value: 'no_courier', label: 'No courier' },
  { value: 'quality_concern', label: 'Quality concern' },
  { value: 'other', label: 'Other' },
];

export const RECEIPT_CONDITIONS = [
  { value: 'ok', label: 'Good condition' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'temperature_breach', label: 'Temperature breach' },
];

export const TRANSFER_STAGES = ['accepted', 'packed', 'courier_assigned', 'in_transit', 'arrived', 'delivered'];

export function productLabel(value) {
  return PRODUCTS.find((p) => p.value === value)?.label || value;
}
