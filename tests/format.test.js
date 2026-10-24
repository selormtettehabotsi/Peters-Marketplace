import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  timeAgo,
  formatDate,
  getInitials,
  escapeHtml,
  toWhatsAppNumber,
  buildWhatsAppLink,
  formatFileSize,
} from '../src/lib/format.js';

describe('formatPrice', () => {
  it('drops decimals for whole amounts and groups thousands', () => {
    expect(formatPrice(25)).toBe('GH₵ 25');
    expect(formatPrice(6400)).toBe('GH₵ 6,400');
  });

  it('keeps two decimals when there are pesewas', () => {
    expect(formatPrice(1499.5)).toBe('GH₵ 1,499.50');
  });

  it('accepts numeric strings (Supabase returns decimals as strings)', () => {
    expect(formatPrice('45.00')).toBe('GH₵ 45');
  });

  it('falls back to zero for junk input', () => {
    expect(formatPrice(null)).toBe('GH₵ 0');
    expect(formatPrice('abc')).toBe('GH₵ 0');
    expect(formatPrice(undefined)).toBe('GH₵ 0');
  });

  it('formats zero as a real price, not a fallback', () => {
    expect(formatPrice(0)).toBe('GH₵ 0');
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const ago = (ms) => new Date(now.getTime() - ms);

  it('reports sub-minute gaps as "just now"', () => {
    expect(timeAgo(ago(30 * 1000), now)).toBe('just now');
  });

  it('reports minutes, hours and days', () => {
    expect(timeAgo(ago(5 * 60 * 1000), now)).toBe('5m ago');
    expect(timeAgo(ago(3 * 60 * 60 * 1000), now)).toBe('3h ago');
    expect(timeAgo(ago(2 * 24 * 60 * 60 * 1000), now)).toBe('2 days ago');
  });

  it('singularises a single day, week and month', () => {
    expect(timeAgo(ago(24 * 60 * 60 * 1000), now)).toBe('1 day ago');
    expect(timeAgo(ago(7 * 24 * 60 * 60 * 1000), now)).toBe('1 week ago');
    expect(timeAgo(ago(35 * 24 * 60 * 60 * 1000), now)).toBe('1 month ago');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(timeAgo('not-a-date', now)).toBe('');
  });
});

describe('formatDate', () => {
  it('renders a short readable date', () => {
    expect(formatDate('2026-10-22T12:00:00Z')).toMatch(/22 Oct 2026/);
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('garbage')).toBe('');
  });
});

describe('getInitials', () => {
  it('takes the first and last initial', () => {
    expect(getInitials('Kwame Mensah')).toBe('KM');
    expect(getInitials('Ama Serwaa Boateng')).toBe('AB');
  });

  it('handles a single name', () => {
    expect(getInitials('Kofi')).toBe('K');
  });

  it('falls back to a question mark when there is no name', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });
});

describe('escapeHtml', () => {
  it('neutralises a script tag', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('escapes quotes so attribute injection is impossible', () => {
    expect(escapeHtml('" onerror="x')).toBe('&quot; onerror=&quot;x');
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes ampersands first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('renders null and undefined as empty strings', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('toWhatsAppNumber', () => {
  it('converts a local Ghanaian number to international format', () => {
    expect(toWhatsAppNumber('0244123456')).toBe('233244123456');
  });

  it('leaves an already-international number alone', () => {
    expect(toWhatsAppNumber('233244123456')).toBe('233244123456');
  });

  it('strips spaces, dashes and plus signs', () => {
    expect(toWhatsAppNumber('+233 24 412 3456')).toBe('233244123456');
    expect(toWhatsAppNumber('024-412-3456')).toBe('233244123456');
  });

  it('returns an empty string when there is no number', () => {
    expect(toWhatsAppNumber('')).toBe('');
    expect(toWhatsAppNumber(null)).toBe('');
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with the product name in the message', () => {
    const link = buildWhatsAppLink('0244123456', 'HP Laptop');
    expect(link).toContain('https://wa.me/233244123456');
    expect(decodeURIComponent(link)).toContain("Hi, I'm interested in HP Laptop");
  });

  it('URL-encodes a title containing special characters', () => {
    const link = buildWhatsAppLink('0244123456', 'Shoes & Socks #1');
    expect(link).not.toContain('&Socks');
    expect(decodeURIComponent(link)).toContain('Shoes & Socks #1');
  });
});

describe('formatFileSize', () => {
  it('scales through bytes, kilobytes and megabytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('handles junk input', () => {
    expect(formatFileSize(-1)).toBe('0 B');
    expect(formatFileSize(NaN)).toBe('0 B');
  });
});
