/** Read a 1-based page number from search params. Invalid values fall back to 1. */
export function pageFromSearch(params, key = 'page') {
  const n = Number.parseInt(params.get(key) || '', 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * Patch list filters into the current URL, replacing the entry.
 * Empty, null, false, and page=1 are omitted so the URL stays tidy
 * and we never send blank page params onward.
 */
export function patchSearchParams(setSearchParams, patch) {
  setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([key, value]) => {
      const omit = value == null || value === '' || value === false
        || (key === 'page' && Number(value) === 1);
      if (omit) next.delete(key);
      else if (value === true) next.set(key, 'true');
      else next.set(key, String(value));
    });
    return next;
  }, { replace: true });
}
