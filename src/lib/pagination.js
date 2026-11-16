// Contract 1.7.0 list pagination. Never send blank, null or non-integer page params
// (the API answers those with 400 validation_error).

export const PAGE_SIZE = 25;
export const PAGE_SIZE_MAX = 100;

/** Integer page and page_size suitable for the query string. */
export function pageParams(page = 1, pageSize = PAGE_SIZE) {
  const p = Number.isInteger(page) && page >= 1 ? page : 1;
  const raw = Number.isInteger(pageSize) && pageSize >= 1 ? pageSize : PAGE_SIZE;
  return { page: p, page_size: Math.min(raw, PAGE_SIZE_MAX) };
}

/** Last 1-based page for a known total (always at least 1). */
export function lastPage(total, pageSize = PAGE_SIZE) {
  const size = pageSize >= 1 ? pageSize : PAGE_SIZE;
  return Math.max(1, Math.ceil(Math.max(0, Number(total) || 0) / size));
}

/** If the requested page is past the end, snap back to the last page that has rows. */
export function clampedPage(page, total, pageSize = PAGE_SIZE) {
  const last = lastPage(total, pageSize);
  return page > last && total > 0 ? last : (Number.isInteger(page) && page >= 1 ? page : 1);
}

/**
 * Normalise a list payload. A paged body is `{ items, page, page_size, total, has_more }`.
 * An unpaged array (old API still live) is treated as a single page.
 */
export function readPage(data, { page = 1, pageSize = PAGE_SIZE } = {}) {
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      page_size: data.length || pageSize,
      total: data.length,
      has_more: false,
    };
  }
  const items = Array.isArray(data?.items) ? data.items : [];
  const size = Number(data?.page_size) > 0 ? Number(data.page_size) : pageSize;
  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length;
  const current = Number(data?.page) >= 1 ? Number(data.page) : page;
  return {
    items,
    page: current,
    page_size: size,
    total,
    has_more: Boolean(data?.has_more),
  };
}
