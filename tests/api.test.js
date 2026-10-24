import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeSearchTerm,
  resolveSort,
  pageRange,
  applyProductFilters,
  calculateSellerStats,
  calculateAdminStats,
  calculateCategoryBreakdown,
} from '../src/lib/api.js';
import { PAGE_SIZE } from '../src/lib/constants.js';

/**
 * Stub Supabase query builder: every method records its call and returns
 * `this`, so a chain can be asserted without a network round-trip.
 */
function stubQuery() {
  const calls = [];
  const builder = {};
  for (const method of ['or', 'eq', 'gte', 'lte', 'order', 'range', 'neq', 'limit']) {
    builder[method] = vi.fn((...args) => {
      calls.push([method, ...args]);
      return builder;
    });
  }
  builder.calls = calls;
  /** Find the first recorded call to a method. */
  builder.callTo = (method) => calls.find((c) => c[0] === method);
  return builder;
}

describe('sanitizeSearchTerm', () => {
  it('leaves an ordinary term untouched', () => {
    expect(sanitizeSearchTerm('laptop')).toBe('laptop');
  });

  it('strips commas and parens that would break a PostgREST or() filter', () => {
    expect(sanitizeSearchTerm('a,b')).toBe('a b');
    expect(sanitizeSearchTerm('shoes (new)')).toBe('shoes  new');
  });

  it('strips percent wildcards so a user cannot match everything', () => {
    expect(sanitizeSearchTerm('%')).toBe('');
    expect(sanitizeSearchTerm('a%b')).toBe('ab');
  });

  it('handles null and undefined', () => {
    expect(sanitizeSearchTerm(null)).toBe('');
    expect(sanitizeSearchTerm(undefined)).toBe('');
  });
});

describe('resolveSort', () => {
  it('maps each sort id to its column and direction', () => {
    expect(resolveSort('price-low')).toEqual({ column: 'price', ascending: true });
    expect(resolveSort('price-high')).toEqual({ column: 'price', ascending: false });
    expect(resolveSort('popular')).toEqual({ column: 'views_count', ascending: false });
    expect(resolveSort('oldest')).toEqual({ column: 'created_at', ascending: true });
  });

  it('falls back to newest for an unknown id', () => {
    expect(resolveSort('nonsense')).toEqual({ column: 'created_at', ascending: false });
    expect(resolveSort(undefined)).toEqual({ column: 'created_at', ascending: false });
  });
});

describe('pageRange', () => {
  it('produces inclusive ranges that do not overlap between pages', () => {
    expect(pageRange(0)).toEqual({ from: 0, to: PAGE_SIZE - 1 });
    expect(pageRange(1)).toEqual({ from: PAGE_SIZE, to: PAGE_SIZE * 2 - 1 });
    expect(pageRange(2, 10)).toEqual({ from: 20, to: 29 });
  });
});

describe('applyProductFilters', () => {
  it('always orders and ranges, even with no filters', () => {
    const q = stubQuery();
    applyProductFilters(q, {}, 0);
    expect(q.callTo('order')).toEqual(['order', 'created_at', { ascending: false }]);
    expect(q.callTo('range')).toEqual(['range', 0, PAGE_SIZE - 1]);
    expect(q.or).not.toHaveBeenCalled();
  });

  it('searches both title and description', () => {
    const q = stubQuery();
    applyProductFilters(q, { q: 'laptop' }, 0);
    expect(q.or).toHaveBeenCalledWith('title.ilike.%laptop%,description.ilike.%laptop%');
  });

  it('skips the search clause for a term that sanitises away to nothing', () => {
    const q = stubQuery();
    applyProductFilters(q, { q: '%%%' }, 0);
    expect(q.or).not.toHaveBeenCalled();
  });

  it('skips category and condition when they are "all"', () => {
    const q = stubQuery();
    applyProductFilters(q, { category: 'all', condition: 'all' }, 0);
    expect(q.eq).not.toHaveBeenCalled();
  });

  it('applies category and condition when they are set', () => {
    const q = stubQuery();
    applyProductFilters(q, { category: 'books', condition: 'new' }, 0);
    expect(q.eq).toHaveBeenCalledWith('category', 'books');
    expect(q.eq).toHaveBeenCalledWith('condition', 'new');
  });

  it('applies a price range', () => {
    const q = stubQuery();
    applyProductFilters(q, { minPrice: 10, maxPrice: 100 }, 0);
    expect(q.gte).toHaveBeenCalledWith('price', 10);
    expect(q.lte).toHaveBeenCalledWith('price', 100);
  });

  it('treats a zero minimum price as a real filter, not an absent one', () => {
    const q = stubQuery();
    applyProductFilters(q, { minPrice: 0 }, 0);
    expect(q.gte).toHaveBeenCalledWith('price', 0);
  });

  it('ignores empty-string price bounds from untouched inputs', () => {
    const q = stubQuery();
    applyProductFilters(q, { minPrice: '', maxPrice: '' }, 0);
    expect(q.gte).not.toHaveBeenCalled();
    expect(q.lte).not.toHaveBeenCalled();
  });

  it('ranges to the requested page', () => {
    const q = stubQuery();
    applyProductFilters(q, {}, 2);
    expect(q.callTo('range')).toEqual(['range', PAGE_SIZE * 2, PAGE_SIZE * 3 - 1]);
  });
});

describe('calculateSellerStats', () => {
  const products = [
    { status: 'available', views_count: 10 },
    { status: 'available', views_count: 5 },
    { status: 'sold', views_count: 20 },
  ];

  it('counts totals, availability and views', () => {
    expect(calculateSellerStats(products)).toEqual({
      total: 3,
      available: 2,
      sold: 1,
      totalViews: 35,
    });
  });

  it('returns zeros for a seller with no listings', () => {
    expect(calculateSellerStats([])).toEqual({
      total: 0,
      available: 0,
      sold: 0,
      totalViews: 0,
    });
  });

  it('treats a missing view count as zero rather than NaN', () => {
    expect(calculateSellerStats([{ status: 'available' }]).totalViews).toBe(0);
  });
});

describe('calculateAdminStats', () => {
  const now = new Date('2026-10-22T15:00:00');
  const products = [
    { status: 'available', views_count: 100, is_flagged: false, created_at: '2026-10-22T09:00:00' },
    { status: 'available', views_count: 50, is_flagged: true, created_at: '2026-10-21T09:00:00' },
    { status: 'sold', views_count: 25, is_flagged: false, created_at: '2026-10-01T09:00:00' },
  ];
  const users = [
    { is_banned: false },
    { is_banned: true },
    { is_banned: false },
  ];

  it('aggregates every overview metric', () => {
    expect(calculateAdminStats(products, users, now)).toEqual({
      totalListings: 3,
      availableListings: 2,
      soldListings: 1,
      totalSellers: 3,
      totalViews: 175,
      flaggedListings: 1,
      bannedUsers: 1,
      newToday: 1,
    });
  });

  it('counts "new today" from midnight, not 24 hours back', () => {
    // 23:00 yesterday is within 24h but is not "today"
    const stats = calculateAdminStats(
      [{ status: 'available', views_count: 0, created_at: '2026-10-21T23:00:00' }],
      [],
      now
    );
    expect(stats.newToday).toBe(0);
  });

  it('handles empty inputs', () => {
    const stats = calculateAdminStats([], [], now);
    expect(stats.totalListings).toBe(0);
    expect(stats.totalViews).toBe(0);
  });
});

describe('calculateCategoryBreakdown', () => {
  it('counts per category and sorts by count descending', () => {
    const rows = calculateCategoryBreakdown([
      { category: 'books' },
      { category: 'electronics' },
      { category: 'books' },
      { category: 'books' },
      { category: 'electronics' },
    ]);

    expect(rows[0]).toEqual({ id: 'books', count: 3, percent: 60 });
    expect(rows[1]).toEqual({ id: 'electronics', count: 2, percent: 40 });
  });

  it('returns an empty list when there are no products', () => {
    expect(calculateCategoryBreakdown([])).toEqual([]);
  });

  it('never divides by zero', () => {
    expect(() => calculateCategoryBreakdown([])).not.toThrow();
  });
});
