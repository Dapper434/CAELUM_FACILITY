import { BLOOD_GROUPS } from './constants';
import { ApiError } from '../lib/http';

export const PICK_BLOOD_GROUP = 'Pick a blood group.';

export function isValidBloodGroup(value) {
  return BLOOD_GROUPS.includes(value);
}

/** Last guard before the network: never send '', 'null' or 'undefined'. */
export function assertBloodGroup(value) {
  if (!isValidBloodGroup(value)) throw new ApiError(0, 'validation_error', PICK_BLOOD_GROUP);
}
