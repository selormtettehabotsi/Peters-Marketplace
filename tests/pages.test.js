import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFiltersFromQuery, buildFilterPath, pageTitleFor } from '../src/pages/products.js';
import { filterAdminListings } from '../src/pages/admin.js';
import { scaleDimensions } from '../src/lib/image-utils.js';
import { checkVideoFile } from '../src/lib/video-utils.js';
import { extractPathFromUrl, uploadProductImage } from '../src/lib/storage.js';
import { supabase } from '../src/supabase.js';

// Canvas/WebP encoding does not exist in jsdom — the storage tests below
// care about upload paths, not pixels.
vi.mock('../src/lib/image-utils.js', async (importOriginal) => ({
  ...(await importOriginal()),
  compressImage: async (file) => file,
  generateThumbnail: async (file) => file,
}));
import { friendlyAuthError } from '../src/lib/auth.js';
import {
  applyErrors,
  clearFieldErrors,
  setButtonLoading,
  readForm,
  field,
  initPasswordToggles,
} from '../src/lib/form-utils.js';

describe('product listing filters', () => {
  it('defaults every filter when the URL is bare', () => {
    expect(readFiltersFromQuery({})).toEqual({
      q: '',
      category: 'all',
      condition: 'all',
      sort: 'newest',
    });
  });

  it('reads filters out of the query string', () => {
    expect(readFiltersFromQuery({ q: 'laptop', category: 'electronics', sort: 'price-low' })).toEqual({
      q: 'laptop',
      category: 'electronics',
      condition: 'all',
      sort: 'price-low',
    });
  });

  it('omits defaults from the built URL so shared links stay short', () => {
    expect(buildFilterPath({ q: '', category: 'all', condition: 'all', sort: 'newest' })).toBe(
      '/products'
    );
  });

  it('includes only the non-default filters', () => {
    expect(buildFilterPath({ q: 'phone', category: 'electronics', condition: 'all', sort: 'newest' })).toBe(
      '/products?q=phone&category=electronics'
    );
  });

  it('URL-encodes a search term with spaces', () => {
    expect(buildFilterPath({ q: 'hp laptop', category: 'all' })).toBe('/products?q=hp+laptop');
  });

  it('round-trips a filter state through the URL', () => {
    const filters = { q: 'shoes', category: 'clothing', condition: 'new', sort: 'price-high' };
    const path = buildFilterPath(filters);
    const query = Object.fromEntries(new URLSearchParams(path.split('?')[1]));
    expect(readFiltersFromQuery(query)).toEqual(filters);
  });

  it('titles the page by search term, then category, then a default', () => {
    expect(pageTitleFor({ q: 'laptop' })).toBe('Results for "laptop"');
    expect(pageTitleFor({ category: 'books' })).toBe('Books');
    expect(pageTitleFor({ category: 'all' })).toBe('All Products');
  });
});

describe('admin listing filters', () => {
  const rows = [
    { id: '1', title: 'HP Laptop', status: 'available', is_flagged: false, seller_id: 'u1' },
    { id: '2', title: 'Textbook', status: 'sold', is_flagged: false, seller_id: 'u2' },
    { id: '3', title: 'Fake Charger', status: 'available', is_flagged: true, seller_id: 'u1' },
  ];
  const base = { status: 'all', flagged: 'all', q: '', sellerId: null };

  it('returns everything with no filters applied', () => {
    expect(filterAdminListings(rows, base)).toHaveLength(3);
  });

  it('filters by status', () => {
    expect(filterAdminListings(rows, { ...base, status: 'sold' })).toHaveLength(1);
  });

  it('shows only flagged rows when asked', () => {
    const result = filterAdminListings(rows, { ...base, flagged: 'flagged' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('searches titles case-insensitively', () => {
    expect(filterAdminListings(rows, { ...base, q: 'laptop' })).toHaveLength(1);
    expect(filterAdminListings(rows, { ...base, q: 'LAPTOP' })).toHaveLength(1);
  });

  it('filters to one seller', () => {
    expect(filterAdminListings(rows, { ...base, sellerId: 'u1' })).toHaveLength(2);
  });

  it('combines filters', () => {
    const result = filterAdminListings(rows, { ...base, sellerId: 'u1', flagged: 'flagged' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});

describe('scaleDimensions', () => {
  it('scales a wide image down and preserves the aspect ratio', () => {
    expect(scaleDimensions(2400, 1800, 1200)).toEqual({ width: 1200, height: 900 });
  });

  it('never upscales a small image', () => {
    expect(scaleDimensions(600, 400, 1200)).toEqual({ width: 600, height: 400 });
  });

  it('handles a portrait image', () => {
    expect(scaleDimensions(3000, 4000, 1200)).toEqual({ width: 1200, height: 1600 });
  });

  it('returns zeroes for missing dimensions', () => {
    expect(scaleDimensions(0, 0, 1200)).toEqual({ width: 0, height: 0 });
  });
});

describe('checkVideoFile', () => {
  const file = (type, sizeMB) => ({ type, size: sizeMB * 1024 * 1024, name: 'clip.mp4' });

  it('accepts a small MP4', () => {
    expect(checkVideoFile(file('video/mp4', 5)).valid).toBe(true);
  });

  it('rejects a video over 10MB', () => {
    const result = checkVideoFile(file('video/mp4', 12));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/under 10MB/);
  });

  it('rejects a non-MP4 container', () => {
    const result = checkVideoFile(file('video/quicktime', 2));
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Only MP4/);
  });

  it('rejects a missing file', () => {
    expect(checkVideoFile(null).valid).toBe(false);
  });
});

describe('extractPathFromUrl', () => {
  const url =
    'https://abc.supabase.co/storage/v1/object/public/product-images/user-1/prod-2/image_0.webp';

  it('recovers the in-bucket path from a public URL', () => {
    expect(extractPathFromUrl(url, 'product-images')).toBe('user-1/prod-2/image_0.webp');
  });

  it('returns null for a URL belonging to a different bucket', () => {
    expect(extractPathFromUrl(url, 'product-videos')).toBeNull();
  });

  it('strips a query string', () => {
    expect(extractPathFromUrl(`${url}?t=123`, 'product-images')).toBe('user-1/prod-2/image_0.webp');
  });

  it('returns null for junk input', () => {
    expect(extractPathFromUrl('', 'product-images')).toBeNull();
    expect(extractPathFromUrl(null, 'product-images')).toBeNull();
    expect(extractPathFromUrl('https://example.com/other.png', 'product-images')).toBeNull();
  });
});

describe('uploadProductImage path naming', () => {
  /**
   * Regression test. Filenames used to come from the image's index in the
   * list. Editing a listing — removing one photo and adding another —
   * reused the index of a photo the seller kept and overwrote it in the
   * bucket, destroying their image.
   *
   * Canvas encoding does not exist in jsdom, so the compression layer is
   * stubbed; what matters here is the storage path each upload receives.
   */
  it('gives each upload a unique path so a kept photo is never overwritten', async () => {
    const uploaded = [];

    vi.spyOn(supabase, 'storage', 'get').mockReturnValue({
      from: () => ({
        upload: async (path) => {
          uploaded.push(path);
          return { error: null };
        },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    });

    const file = new Blob(['x'], { type: 'image/jpeg' });

    await uploadProductImage(file, 'user-1', 'prod-1');
    await uploadProductImage(file, 'user-1', 'prod-1');

    const imagePaths = uploaded.filter((p) => p.includes('/image_'));
    expect(imagePaths).toHaveLength(2);

    // Two uploads must not collide...
    expect(imagePaths[0]).not.toBe(imagePaths[1]);
    // ...and neither may be named by list position, the original bug.
    expect(imagePaths[0]).not.toMatch(/image_\d+\.webp$/);

    vi.restoreAllMocks();
  });
});

describe('friendlyAuthError', () => {
  it('rewrites a duplicate-email error', () => {
    expect(friendlyAuthError('User already registered')).toBe(
      'An account with this email already exists'
    );
  });

  it('rewrites bad credentials', () => {
    expect(friendlyAuthError('Invalid login credentials')).toBe('Incorrect email or password');
  });

  it('rewrites a network failure', () => {
    expect(friendlyAuthError('Failed to fetch')).toBe(
      'Network error. Please check your connection'
    );
  });

  it('passes an unrecognised message through unchanged', () => {
    expect(friendlyAuthError('Some new Supabase error')).toBe('Some new Supabase error');
  });

  it('has a fallback for an empty message', () => {
    expect(friendlyAuthError('')).toBe('Something went wrong. Please try again.');
  });
});

describe('form utilities', () => {
  let form;

  beforeEach(() => {
    document.getElementById('page-content').innerHTML = `
      <form id="t">
        <input name="email" />
        <p data-error-for="email"></p>
        <input name="password" />
        <p data-error-for="password"></p>
        <button type="submit">Log In</button>
      </form>
    `;
    form = document.getElementById('t');
  });

  it('marks invalid fields and writes the messages', () => {
    applyErrors(form, { email: 'Email is required' });
    expect(form.querySelector('[name="email"]').classList.contains('error')).toBe(true);
    expect(form.querySelector('[data-error-for="email"]').textContent).toBe('Email is required');
  });

  it('flags the field as invalid for assistive tech', () => {
    applyErrors(form, { email: 'Bad' });
    expect(form.querySelector('[name="email"]').getAttribute('aria-invalid')).toBe('true');
  });

  it('clears previous errors on the next submit', () => {
    applyErrors(form, { email: 'Email is required' });
    clearFieldErrors(form);
    expect(form.querySelector('.error')).toBeNull();
    expect(form.querySelector('[data-error-for="email"]').textContent).toBe('');
  });

  it('reports whether anything was invalid', () => {
    expect(applyErrors(form, {})).toBe(false);
    expect(applyErrors(form, { email: 'x' })).toBe(true);
  });

  it('shows a spinner while submitting and restores the label afterwards', () => {
    const button = form.querySelector('button');
    const restore = setButtonLoading(button, 'Logging in…');

    expect(button.disabled).toBe(true);
    expect(button.querySelector('.spinner')).not.toBeNull();

    restore();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Log In');
  });

  it('reads and trims form values', () => {
    form.querySelector('[name="email"]').value = '  kwame@test.com  ';
    form.querySelector('[name="password"]').value = 'secret';
    expect(readForm(form)).toEqual({ email: 'kwame@test.com', password: 'secret' });
  });
});

describe('password visibility toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = field({ name: 'password', label: 'Password', type: 'password' });
    initPasswordToggles();
  });

  it('renders an eye button that starts with the password hidden', () => {
    const button = document.querySelector('[data-toggle-password]');
    expect(document.querySelector('[name="password"]').type).toBe('password');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Show password');
  });

  it('shows the password on click and hides it again on a second click', () => {
    const input = document.querySelector('[name="password"]');
    const button = document.querySelector('[data-toggle-password]');

    button.click();
    expect(input.type).toBe('text');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Hide password');

    button.click();
    expect(input.type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe('Show password');
  });

  it('does not add a toggle to other input types', () => {
    document.body.innerHTML = field({ name: 'email', label: 'Email', type: 'email' });
    expect(document.querySelector('[data-toggle-password]')).toBeNull();
  });
});
