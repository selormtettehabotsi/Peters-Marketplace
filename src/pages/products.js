import { CATEGORIES, CONDITIONS, SORT_OPTIONS, PAGE_SIZE } from '../lib/constants.js';
import { fetchProducts } from '../lib/api.js';
import { renderProductGrid } from '../components/product-card.js';
import { renderSkeletonGrid } from '../components/skeleton-loader.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../lib/format.js';
import { watchNavigation } from '../router.js';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Read the listing filters out of the current hash query string.
 * @param {Object} [query] - pre-parsed params from the router
 * @returns {{q: string, category: string, condition: string, sort: string}}
 */
export function readFiltersFromQuery(query = {}) {
  return {
    q: query.q || '',
    category: query.category || 'all',
    condition: query.condition || 'all',
    sort: query.sort || 'newest',
  };
}

/**
 * Build the hash URL that represents a filter state.
 * Defaults are omitted so shared links stay short.
 * @param {Object} filters
 * @returns {string} e.g. '/products?q=phone&category=electronics'
 */
export function buildFilterPath(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.condition && filters.condition !== 'all') params.set('condition', filters.condition);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);

  const qs = params.toString();
  return '/products' + (qs ? `?${qs}` : '');
}

/**
 * Heading text for the current filter state.
 * @param {Object} filters
 * @returns {string}
 */
export function pageTitleFor(filters) {
  if (filters.q) return `Results for "${filters.q}"`;
  if (filters.category && filters.category !== 'all') {
    const cat = CATEGORIES.find((c) => c.id === filters.category);
    if (cat) return cat.name;
  }
  return 'All Products';
}

/**
 * Product listing page.
 * @param {Object} params - router params; params.query holds the filters
 * @param {HTMLElement} container
 */
export default async function renderProducts(params, container) {
  let filters = readFiltersFromQuery(params.query);
  let page = 0;
  let total = 0;
  let loading = false;
  // Incremented per fetch so a superseded response can be discarded.
  let requestId = 0;
  const isStale = watchNavigation();

  container.innerHTML = `
    <div class="container section-sm">
      <div class="page-header">
        <h1 class="page-title" id="results-title">${escapeHtml(pageTitleFor(filters))}</h1>
        <p class="page-subtitle">Everything on sale at St. Peter's Hostel</p>
      </div>

      <div class="browse-toolbar">
        <div class="browse-search-row">
          <div class="search-bar">
            <span class="search-icon">${icon('search', { size: 18 })}</span>
            <input
              type="search"
              class="form-input"
              id="product-search"
              placeholder="Search products..."
              aria-label="Search products"
              enterkeyhint="search"
              value="${escapeHtml(filters.q)}"
            />
          </div>
          <button type="button" class="btn btn-secondary filter-toggle hide-desktop" id="filter-toggle"
                  aria-haspopup="dialog" aria-controls="filter-sheet" aria-expanded="false">
            ${icon('sliders', { size: 18 })}
            <span>Filters</span>
            <span class="filter-count hidden" id="filter-count"></span>
          </button>
        </div>

        <span class="sr-only" id="category-label">Category</span>
        <div class="pill-group" id="category-filter" role="group" aria-labelledby="category-label">
          <button class="pill${filters.category === 'all' ? ' active' : ''}" data-category="all">All</button>
          ${CATEGORIES.map(
            (c) => `
            <button class="pill${filters.category === c.id ? ' active' : ''}" data-category="${c.id}">
              ${icon(c.icon, { size: 16 })} ${c.name}
            </button>
          `
          ).join('')}
        </div>
      </div>

      <!-- Inline on desktop; a bottom sheet on phones -->
      <div class="sheet-backdrop" id="filter-backdrop" hidden></div>
      <div class="filter-sheet" id="filter-sheet" role="dialog" aria-modal="false" aria-labelledby="filter-sheet-title">
        <div class="sheet-header hide-desktop">
          <span class="sheet-handle" aria-hidden="true"></span>
          <h2 class="sheet-title" id="filter-sheet-title">Filters</h2>
          <button type="button" class="btn btn-icon btn-ghost" data-close-filters aria-label="Close filters">
            ${icon('close')}
          </button>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label" for="filter-condition">Condition</label>
            <select class="form-select" id="filter-condition">
              <option value="all">All Conditions</option>
              ${CONDITIONS.map(
                (c) =>
                  `<option value="${c.id}" ${filters.condition === c.id ? 'selected' : ''}>${c.name}</option>`
              ).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label" for="filter-sort">Sort By</label>
            <select class="form-select" id="filter-sort">
              ${SORT_OPTIONS.map(
                (s) =>
                  `<option value="${s.id}" ${filters.sort === s.id ? 'selected' : ''}>${s.name}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="sheet-footer hide-desktop">
          <button type="button" class="btn btn-ghost" id="filter-reset">Reset</button>
          <button type="button" class="btn btn-primary btn-lg" data-close-filters>Show results</button>
        </div>
      </div>

      <p class="results-count" id="results-count" aria-live="polite"></p>

      <div class="product-grid stagger-children" id="products-grid"></div>

      <div class="load-more-wrap hidden" id="load-more-wrap">
        <button class="btn btn-secondary btn-lg" id="load-more">Load More Products</button>
      </div>
    </div>
  `;

  const grid = container.querySelector('#products-grid');
  const countEl = container.querySelector('#results-count');
  const titleEl = container.querySelector('#results-title');
  const loadMoreWrap = container.querySelector('#load-more-wrap');
  const loadMoreBtn = container.querySelector('#load-more');
  const searchInput = container.querySelector('#product-search');

  /** Push the current filters into the URL without triggering a re-route. */
  function syncURL() {
    history.replaceState(null, '', '#' + buildFilterPath(filters));
  }

  /** True when anything narrows the list beyond "everything, newest first". */
  function hasActiveFilters() {
    return Boolean(filters.q) || filters.category !== 'all' || filters.condition !== 'all';
  }

  function renderEmptyState() {
    // With filters on, the way out is to loosen them. With none, the
    // marketplace is genuinely empty — invite the first listing instead of
    // linking back to this same empty page.
    grid.innerHTML = hasActiveFilters()
      ? `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">${icon('search', { size: 32 })}</div>
        <div class="empty-title">Nothing matches that yet</div>
        <div class="empty-description">Try a different search term, or clear the filters to see everything for sale.</div>
        <button type="button" class="btn btn-primary" data-clear-filters>Clear filters</button>
      </div>
    `
      : `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">${icon('package', { size: 32 })}</div>
        <div class="empty-title">No listings yet</div>
        <div class="empty-description">Nobody has posted anything for sale. Be the first, it takes a minute.</div>
        <a href="#/dashboard/new" class="btn btn-primary">${icon('plus', { size: 16 })} Sell an item</a>
      </div>
    `;
  }

  function renderError(err) {
    const isMissingTables = err?.code === 'PGRST205' || String(err?.message || '').includes('schema cache');
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">${icon('alert', { size: 32 })}</div>
        <div class="empty-title">${isMissingTables ? 'Database Tables Not Initialized' : "Couldn't load products"}</div>
        <div class="empty-description">
          ${
            isMissingTables
              ? 'Connected to Supabase, but the database schema has not been run yet. Please run <code>supabase/schema.sql</code> in your Supabase SQL Editor.'
              : 'Check your connection, or configure Supabase in <code>src/supabase.js</code>.'
          }
        </div>
      </div>
    `;
  }

  /**
   * Load page 0 and replace the grid.
   *
   * Each call takes a ticket. A filter change during an in-flight fetch
   * issues a newer ticket, and the older response is discarded when it
   * lands — so the grid always ends up matching the newest filters rather
   * than whichever request happened to start first.
   */
  async function loadFirstPage() {
    const ticket = ++requestId;
    loading = true;
    page = 0;
    titleEl.textContent = pageTitleFor(filters);
    grid.classList.add('is-loading');
    renderSkeletonGrid(grid, 8);
    countEl.textContent = '';
    loadMoreWrap.classList.add('hidden');

    const { products, count, error } = await fetchProducts(filters, 0);
    if (isStale() || ticket !== requestId) return;

    grid.classList.remove('is-loading');
    loading = false;

    if (error) {
      renderError(error);
      return;
    }

    total = count;

    if (products.length === 0) {
      renderEmptyState();
      return;
    }

    renderProductGrid(grid, products);
    countEl.textContent = `Showing ${products.length} of ${total} product${total === 1 ? '' : 's'}`;
    loadMoreWrap.classList.toggle('hidden', products.length >= total);
  }

  /**
   * Append the next page to the existing grid.
   * Unlike a filter change, a second click here is genuinely redundant,
   * so an in-flight request is left to finish.
   */
  async function loadMore() {
    if (loading) return;
    loading = true;
    page += 1;

    const ticket = ++requestId;
    const originalLabel = loadMoreBtn.innerHTML;
    loadMoreBtn.disabled = true;
    loadMoreBtn.innerHTML = '<span class="spinner spinner-sm"></span><span>Loading…</span>';

    const { products, count, error } = await fetchProducts(filters, page);

    // A filter change during the fetch already rebuilt the grid — appending
    // this page would mix results from two different filter sets.
    if (isStale() || ticket !== requestId) {
      loading = false;
      return;
    }

    loadMoreBtn.disabled = false;
    loadMoreBtn.innerHTML = originalLabel;
    loading = false;

    if (error) {
      page -= 1; // let the user retry the same page
      return;
    }

    total = count || total;
    renderProductGrid(grid, products, { append: true });

    const shown = grid.querySelectorAll('.product-card').length;
    countEl.textContent = `Showing ${shown} of ${total} product${total === 1 ? '' : 's'}`;

    if (products.length < PAGE_SIZE || shown >= total) {
      loadMoreWrap.classList.add('hidden');
    }
  }

  /** Merge a filter change, sync the URL and refetch. */
  function updateFilters(patch) {
    filters = { ...filters, ...patch };
    syncURL();
    updateFilterCount();
    loadFirstPage();
  }

  // ---- Events ----

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const value = e.target.value;
    searchTimeout = setTimeout(() => updateFilters({ q: value.trim() }), SEARCH_DEBOUNCE_MS);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(searchTimeout);
      updateFilters({ q: e.target.value.trim() });
    }
  });

  container.querySelector('#category-filter').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-category]');
    if (!pill) return;
    container
      .querySelectorAll('#category-filter .pill')
      .forEach((p) => p.classList.toggle('active', p === pill));
    updateFilters({ category: pill.dataset.category });
  });

  container.querySelector('#filter-condition').addEventListener('change', (e) => {
    updateFilters({ condition: e.target.value });
  });

  container.querySelector('#filter-sort').addEventListener('change', (e) => {
    updateFilters({ sort: e.target.value });
  });

  // ---- Mobile filter sheet ----
  const sheet = container.querySelector('#filter-sheet');
  const backdrop = container.querySelector('#filter-backdrop');
  const toggle = container.querySelector('#filter-toggle');
  const countBadge = container.querySelector('#filter-count');

  function setSheetOpen(open) {
    sheet.classList.toggle('is-open', open);
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sheet-open', open);
    if (open) sheet.querySelector('select')?.focus();
    else if (document.activeElement && sheet.contains(document.activeElement)) toggle.focus();
  }

  /** Badge on the Filters button: how many sheet filters are not default. */
  function updateFilterCount() {
    const active = (filters.condition !== 'all') + (filters.sort !== 'newest');
    countBadge.textContent = String(active);
    countBadge.classList.toggle('hidden', active === 0);
  }

  toggle.addEventListener('click', () => setSheetOpen(true));
  backdrop.addEventListener('click', () => setSheetOpen(false));
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-filters]')) setSheetOpen(false);
  });
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setSheetOpen(false);
  });

  container.querySelector('#filter-reset').addEventListener('click', () => {
    container.querySelector('#filter-condition').value = 'all';
    container.querySelector('#filter-sort').value = 'newest';
    updateFilters({ condition: 'all', sort: 'newest' });
  });

  updateFilterCount();

  grid.addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear-filters]')) return;
    searchInput.value = '';
    container.querySelector('#filter-condition').value = 'all';
    container
      .querySelectorAll('#category-filter .pill')
      .forEach((p) => p.classList.toggle('active', p.dataset.category === 'all'));
    updateFilters({ q: '', category: 'all', condition: 'all' });
  });

  loadMoreBtn.addEventListener('click', loadMore);

  await loadFirstPage();
}
