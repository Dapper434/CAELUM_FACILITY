// Rules from contract 1.2.0 (Facility contact fields).
export const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;

export function validateContact(form) {
  const errors = {};
  if (form.contact_name.trim().length > 120) errors.contact_name = 'At most 120 characters.';
  const phone = form.contact_phone.trim();
  if (phone && !PHONE_RE.test(phone)) errors.contact_phone = 'Use digits, spaces, ( ) or -, optionally starting with +.';
  if (form.address.trim().length > 300) errors.address = 'At most 300 characters.';
  return errors;
}

/** Only changed fields; empty strings become null. */
export function toContactPayload(facility, form) {
  const body = {};
  ['contact_name', 'contact_phone', 'address'].forEach((k) => {
    const v = form[k].trim() || null;
    if (v !== (facility?.[k] ?? null)) body[k] = v;
  });
  return body;
}
