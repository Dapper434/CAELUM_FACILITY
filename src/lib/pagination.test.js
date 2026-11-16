import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, clampedPage, lastPage, pageParams, readPage } from './pagination';

describe('pageParams', () => {
  it('sends 1-based page and a default page_size of 25, and never sends blank or invalid values', () => {
    expect(pageParams()).toEqual({ page: 1, page_size: 25 });
    expect(pageParams(3)).toEqual({ page: 3, page_size: PAGE_SIZE });
    expect(pageParams(2, 50)).toEqual({ page: 2, page_size: 50 });
    expect(pageParams(2, 250)).toEqual({ page: 2, page_size: 100 });
    expect(pageParams(0, 25)).toEqual({ page: 1, page_size: 25 });
    expect(pageParams(null, null)).toEqual({ page: 1, page_size: 25 });
    expect(pageParams('null', 'undefined')).toEqual({ page: 1, page_size: 25 });
    expect(Object.values(pageParams(1, 25)).every((v) => Number.isInteger(v) && v >= 1)).toBe(true);
  });
});

describe('readPage', () => {
  it('reads items, total and has_more from a paged body', () => {
    const parsed = readPage({ items: [{ id: 'a' }], page: 2, page_size: 25, total: 60, has_more: true }, { page: 2 });
    expect(parsed).toEqual({ items: [{ id: 'a' }], page: 2, page_size: 25, total: 60, has_more: true });
  });

  it('treats an unpaged array as a single page', () => {
    const rows = [{ id: 'a' }, { id: 'b' }];
    expect(readPage(rows)).toEqual({ items: rows, page: 1, page_size: 2, total: 2, has_more: false });
    expect(readPage(null).items).toEqual([]);
  });
});

describe('past-end clamp', () => {
  it('snaps back to the last page that has rows', () => {
    expect(lastPage(40, 25)).toBe(2);
    expect(clampedPage(9, 40, 25)).toBe(2);
    expect(clampedPage(2, 40, 25)).toBe(2);
    expect(clampedPage(1, 0, 25)).toBe(1);
  });
});
