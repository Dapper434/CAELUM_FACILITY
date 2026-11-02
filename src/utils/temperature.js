// Bands from the API config (contract 5.7).
export const TEMP_BANDS = {
  packed_rbc: [2, 6],
  whole_blood: [2, 6],
  platelets: [20, 24],
  plasma: [-40, -18],
};

export function isExcursion(tempC, productType = 'packed_rbc', reading) {
  if (reading && typeof reading.excursion === 'boolean') return reading.excursion;
  const band = TEMP_BANDS[productType];
  if (!band || tempC === null || tempC === undefined) return false;
  return tempC < band[0] || tempC > band[1];
}
