import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  pathToRegex,
  extractParamNames,
  addRoute,
  setNotFound,
  handleRoute,
  getCurrentPath,
  getQueryParams,
  watchNavigation,
  _resetRoutes,
} from '../src/router.js';

describe('pathToRegex', () => {
  it('matches a static path exactly', () => {
    const re = pathToRegex('/products');
    expect(re.test('/products')).toBe(true);
    expect(re.test('/products/123')).toBe(false);
    expect(re.test('/other')).toBe(false);
  });

  it('captures a single dynamic segment', () => {
    const re = pathToRegex('/products/:id');
    expect('/products/abc-123'.match(re)[1]).toBe('abc-123');
  });

  it('does not let a param swallow a slash', () => {
    const re = pathToRegex('/products/:id');
    expect(re.test('/products/a/b')).toBe(false);
  });

  it('handles multiple params', () => {
    const re = pathToRegex('/dashboard/edit/:id');
    expect('/dashboard/edit/xyz'.match(re)[1]).toBe('xyz');
  });
});

describe('extractParamNames', () => {
  it('lists param names in order', () => {
    expect(extractParamNames('/products/:id')).toEqual(['id']);
    expect(extractParamNames('/a/:x/b/:y')).toEqual(['x', 'y']);
  });

  it('returns an empty list for a static path', () => {
    expect(extractParamNames('/products')).toEqual([]);
  });
});

describe('getCurrentPath', () => {
  it('defaults to the root path when there is no hash', () => {
    window.location.hash = '';
    expect(getCurrentPath()).toBe('/');
  });

  it('strips the query string', () => {
    window.location.hash = '#/products?q=laptop&sort=newest';
    expect(getCurrentPath()).toBe('/products');
  });

  it('returns a plain path unchanged', () => {
    window.location.hash = '#/dashboard';
    expect(getCurrentPath()).toBe('/dashboard');
  });
});

describe('getQueryParams', () => {
  it('parses the hash query string', () => {
    window.location.hash = '#/products?q=laptop&category=electronics';
    expect(getQueryParams()).toEqual({ q: 'laptop', category: 'electronics' });
  });

  it('returns an empty object when there is no query string', () => {
    window.location.hash = '#/products';
    expect(getQueryParams()).toEqual({});
  });

  it('decodes encoded values', () => {
    window.location.hash = '#/products?q=hp%20laptop';
    expect(getQueryParams().q).toBe('hp laptop');
  });
});

describe('route dispatch', () => {
  beforeEach(() => {
    _resetRoutes();
  });

  it('calls the handler whose pattern matches', async () => {
    const home = vi.fn();
    const products = vi.fn();
    addRoute('/', home);
    addRoute('/products', products);

    window.location.hash = '#/products';
    await handleRoute();

    expect(products).toHaveBeenCalledTimes(1);
    expect(home).not.toHaveBeenCalled();
  });

  it('passes URL params to the handler', async () => {
    const detail = vi.fn();
    addRoute('/products/:id', detail);

    window.location.hash = '#/products/abc-123';
    await handleRoute();

    expect(detail.mock.calls[0][0]).toMatchObject({ id: 'abc-123' });
  });

  it('passes the parsed query string alongside the params', async () => {
    const products = vi.fn();
    addRoute('/products', products);

    window.location.hash = '#/products?q=phone';
    await handleRoute();

    expect(products.mock.calls[0][0].query).toEqual({ q: 'phone' });
  });

  it('URL-decodes a param', async () => {
    const handler = vi.fn();
    addRoute('/category/:name', handler);

    window.location.hash = '#/category/food%2Dsnacks';
    await handleRoute();

    expect(handler.mock.calls[0][0].name).toBe('food-snacks');
  });

  it('falls back to the 404 handler when nothing matches', async () => {
    const notFound = vi.fn();
    addRoute('/', vi.fn());
    setNotFound(notFound);

    window.location.hash = '#/nowhere';
    await handleRoute();

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('renders an error state instead of throwing when a handler fails', async () => {
    addRoute('/boom', () => {
      throw new Error('handler exploded');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    window.location.hash = '#/boom';
    await expect(handleRoute()).resolves.toBeUndefined();

    expect(document.getElementById('page-content').innerHTML).toContain('Something went wrong');
  });

  it('marks an in-flight handler stale once another navigation starts', async () => {
    addRoute('/a', vi.fn());
    addRoute('/b', vi.fn());

    window.location.hash = '#/a';
    await handleRoute();

    const isStale = watchNavigation();
    expect(isStale()).toBe(false);

    window.location.hash = '#/b';
    await handleRoute();

    expect(isStale()).toBe(true);
  });

  it('does not let a slow handler overwrite the page the user moved to', async () => {
    const content = document.getElementById('page-content');
    let releaseSlowFetch;
    const slowFetch = new Promise((resolve) => {
      releaseSlowFetch = resolve;
    });

    addRoute('/slow', async (params, container) => {
      const isStale = watchNavigation();
      await slowFetch;
      if (isStale()) return;
      container.innerHTML = '<p>slow page</p>';
    });
    addRoute('/fast', (params, container) => {
      container.innerHTML = '<p>fast page</p>';
    });

    window.location.hash = '#/slow';
    const slowRoute = handleRoute();

    // The user navigates away before the slow fetch resolves.
    window.location.hash = '#/fast';
    await handleRoute();
    expect(content.innerHTML).toContain('fast page');

    releaseSlowFetch();
    await slowRoute;

    expect(content.innerHTML).toContain('fast page');
    expect(content.innerHTML).not.toContain('slow page');
  });

  it('matches the most specific route rather than a prefix', async () => {
    const list = vi.fn();
    const detail = vi.fn();
    addRoute('/products', list);
    addRoute('/products/:id', detail);

    window.location.hash = '#/products/xyz';
    await handleRoute();

    expect(detail).toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });
});
