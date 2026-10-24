import {
  fetchAllProducts,
  fetchAllUsers,
  calculateAdminStats,
  calculateCategoryBreakdown,
  setProductFlag,
  adminDeleteProductRow,
  setUserBanned,
} from '../lib/api.js';
import { deleteProductMedia } from '../lib/storage.js';
import { getCategory } from '../lib/constants.js';
import { formatPrice, formatDate, escapeHtml, getInitials } from '../lib/format.js';
import { cardImageUrl } from '../components/product-card.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { getUser } from '../lib/auth.js';
import { watchNavigation } from '../router.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'listings', label: 'Listings', icon: 'package' },
  { id: 'users', label: 'Users', icon: 'users' },
];

const STAT_TILES = [
  { key: 'totalListings', label: 'Total Listings', icon: 'package' },
  { key: 'availableListings', label: 'Available', icon: 'check-circle' },
  { key: 'soldListings', label: 'Sold', icon: 'tag' },
  { key: 'totalSellers', label: 'Total Sellers', icon: 'users' },
  { key: 'totalViews', label: 'Total Views', icon: 'eye' },
  { key: 'flaggedListings', label: 'Flagged', icon: 'flag' },
  { key: 'bannedUsers', label: 'Banned Users', icon: 'ban' },
  { key: 'newToday', label: 'New Today', icon: 'calendar' },
];

/**
 * Admin panel — overview, listing moderation and user management.
 * Route registration already restricts this to role = 'admin'; RLS enforces
 * the same rules on the server.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default async function renderAdmin(params, container) {
  let products = [];
  let users = [];
  let activeTab = 'overview';
  const isStale = watchNavigation();

  // Listings tab filters
  let listingFilters = { status: 'all', flagged: 'all', q: '', sellerId: null };

  container.innerHTML = `
    <div class="container section-sm">
      <div class="page-header">
        <h1 class="page-title">Admin Panel</h1>
        <p class="page-subtitle">Marketplace administration</p>
      </div>

      <div class="admin-tabs" role="tablist">
        ${TABS.map(
          (t) => `
          <button class="admin-tab${t.id === 'overview' ? ' active' : ''}"
                  data-tab="${t.id}" role="tab"
                  aria-selected="${t.id === 'overview'}">
            ${icon(t.icon, { size: 16 })} ${t.label}
          </button>
        `
        ).join('')}
      </div>

      <div id="tab-content">
        <div class="stats-row">
          ${Array.from({ length: 8 }, () => '<div class="skeleton" style="height:118px;"></div>').join('')}
        </div>
      </div>
    </div>
  `;

  const tabContent = container.querySelector('#tab-content');

  /* ========================================
     DATA
     ======================================== */

  async function loadData() {
    const [productResult, userResult] = await Promise.all([fetchAllProducts(), fetchAllUsers()]);
    if (isStale()) return false;

    if (productResult.error || userResult.error) {
      tabContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${icon('wifi_off', { size: 32 })}</div>
          <div class="empty-title">Couldn't load admin data</div>
          <div class="empty-description">Check your connection and try again.</div>
        </div>
      `;
      return false;
    }

    products = productResult.products;
    users = userResult.users;
    return true;
  }

  /* ========================================
     TAB 1 — OVERVIEW
     ======================================== */

  function renderOverview() {
    const stats = calculateAdminStats(products, users);
    const breakdown = calculateCategoryBreakdown(products);

    tabContent.innerHTML = `
      <div class="stats-row">
        ${STAT_TILES.map(
          (tile) => `
          <div class="stat-card">
            <span class="stat-icon">${icon(tile.icon, { size: 20 })}</span>
            <div class="stat-value">${stats[tile.key].toLocaleString()}</div>
            <div class="stat-label">${tile.label}</div>
          </div>
        `
        ).join('')}
      </div>

      <section class="mt-8">
        <h2 class="h3 mb-6">Listings by Category</h2>
        ${
          breakdown.length === 0
            ? '<p class="text-muted">No listings yet.</p>'
            : breakdown
                .map((row) => {
                  const cat = getCategory(row.id);
                  return `
                  <div class="category-bar">
                    <span class="category-bar-label icon-row">
                      ${icon(cat.icon, { size: 16 })} ${escapeHtml(cat.name)}
                    </span>
                    <span class="category-bar-track">
                      <span class="category-bar-fill" style="width: ${row.percent}%"></span>
                    </span>
                    <span class="category-bar-value">${row.count} (${row.percent}%)</span>
                  </div>
                `;
                })
                .join('')
        }
      </section>
    `;
  }

  /* ========================================
     TAB 2 — LISTINGS
     ======================================== */

  /**
   * Render the whole tab: filter controls plus results.
   * Typing in the search box re-renders only the results (see
   * renderListingResults), so the input is never torn out from under the
   * caret mid-edit.
   */
  function renderListings() {
    const sellerName = listingFilters.sellerId
      ? users.find((u) => u.id === listingFilters.sellerId)?.full_name
      : null;

    tabContent.innerHTML = `
      <div class="filter-bar">
        <div class="search-bar mb-4" style="max-width:none;">
          <span class="search-icon">${icon('search', { size: 18 })}</span>
          <input type="search" class="form-input" id="admin-search"
                 placeholder="Search listings by title..."
                 aria-label="Search listings"
                 value="${escapeHtml(listingFilters.q)}" />
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label" for="admin-status">Status</label>
            <select class="form-select" id="admin-status">
              <option value="all" ${listingFilters.status === 'all' ? 'selected' : ''}>All</option>
              <option value="available" ${listingFilters.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="sold" ${listingFilters.status === 'sold' ? 'selected' : ''}>Sold</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="admin-flagged">Flagged</label>
            <select class="form-select" id="admin-flagged">
              <option value="all" ${listingFilters.flagged === 'all' ? 'selected' : ''}>All</option>
              <option value="flagged" ${listingFilters.flagged === 'flagged' ? 'selected' : ''}>Flagged Only</option>
            </select>
          </div>
        </div>

        ${
          sellerName
            ? `<p class="results-count icon-row">
                 ${icon('user', { size: 14 })} Showing listings by ${escapeHtml(sellerName)}
                 <button class="btn btn-ghost btn-sm" data-clear-seller>Clear</button>
               </p>`
            : ''
        }
      </div>

      <div id="listing-results"></div>
    `;

    renderListingResults();
    bindListingEvents();
  }

  /** Re-render just the results table, leaving the filter controls in place. */
  function renderListingResults() {
    const results = tabContent.querySelector('#listing-results');
    if (!results) return;

    const rows = filterAdminListings(products, listingFilters);

    results.innerHTML = `
      <p class="results-count">${rows.length} listing${rows.length === 1 ? '' : 's'}</p>

      ${
        rows.length === 0
          ? `<div class="empty-state">
               <div class="empty-icon">${icon('package', { size: 32 })}</div>
               <div class="empty-title">No listings match</div>
               <div class="empty-description">Try changing the filters above.</div>
             </div>`
          : `
        <table class="admin-table">
          <thead>
            <tr>
              <th scope="col">Image</th>
              <th scope="col">Title</th>
              <th scope="col">Seller</th>
              <th scope="col">Price</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((p) => listingRow(p)).join('')}
          </tbody>
        </table>

        <div class="admin-cards">
          ${rows.map((p) => listingCard(p)).join('')}
        </div>
      `
      }
    `;
  }

  function listingActions(product) {
    return `
      <div class="listing-row-actions">
        <a href="#/products/${product.id}" class="btn btn-ghost btn-sm">
          ${icon('eye', { size: 14 })} View
        </a>
        <button class="btn btn-ghost btn-sm" data-flag="${product.id}" data-flagged="${product.is_flagged}">
          ${icon(product.is_flagged ? 'check' : 'flag', { size: 14 })}
          ${product.is_flagged ? 'Unflag' : 'Flag'}
        </button>
        <button class="btn btn-ghost btn-sm" data-admin-delete="${product.id}"
                style="color: var(--color-danger);">
          ${icon('trash', { size: 14 })} Delete
        </button>
      </div>
    `;
  }

  function listingRow(product) {
    const cat = getCategory(product.category);
    return `
      <tr>
        <td><img src="${escapeHtml(cardImageUrl(product))}" class="thumb" alt="" loading="lazy" /></td>
        <td>
          <a href="#/products/${product.id}" class="font-medium">${escapeHtml(product.title)}</a>
          ${product.is_flagged ? `<span class="badge badge-warning" style="margin-left:var(--space-2);">Flagged</span>` : ''}
        </td>
        <td>${escapeHtml(product.profiles?.full_name || 'N/A')}</td>
        <td>${escapeHtml(formatPrice(product.price))}</td>
        <td><span class="icon-row">${icon(cat.icon, { size: 14 })} ${escapeHtml(cat.name)}</span></td>
        <td>
          <span class="badge badge-${product.status === 'sold' ? 'danger' : 'success'}">
            ${product.status === 'sold' ? 'Sold' : 'Available'}
          </span>
        </td>
        <td>${escapeHtml(formatDate(product.created_at))}</td>
        <td>${listingActions(product)}</td>
      </tr>
    `;
  }

  function listingCard(product) {
    return `
      <div class="admin-card">
        <div class="flex items-center gap-3 mb-4">
          <img src="${escapeHtml(cardImageUrl(product))}" class="thumb" alt="" loading="lazy" />
          <div class="flex-1">
            <a href="#/products/${product.id}" class="font-semibold">${escapeHtml(product.title)}</a>
            <p class="text-sm text-muted" style="margin:0;">
              ${escapeHtml(product.profiles?.full_name || 'N/A')} ·
              ${escapeHtml(formatPrice(product.price))}
            </p>
          </div>
          ${product.is_flagged ? '<span class="badge badge-warning">Flagged</span>' : ''}
        </div>
        ${listingActions(product)}
      </div>
    `;
  }

  function bindListingEvents() {
    const search = tabContent.querySelector('#admin-search');
    if (search) {
      let timer;
      search.addEventListener('input', (e) => {
        clearTimeout(timer);
        const value = e.target.value;
        timer = setTimeout(() => {
          listingFilters.q = value.trim();
          // Results only — the input keeps its focus and caret position.
          renderListingResults();
        }, 300);
      });
    }

    tabContent.querySelector('#admin-status')?.addEventListener('change', (e) => {
      listingFilters.status = e.target.value;
      renderListingResults();
    });

    tabContent.querySelector('#admin-flagged')?.addEventListener('change', (e) => {
      listingFilters.flagged = e.target.value;
      renderListingResults();
    });

    tabContent.querySelector('[data-clear-seller]')?.addEventListener('click', () => {
      listingFilters.sellerId = null;
      renderListings();
    });
  }

  /* ========================================
     TAB 3 — USERS
     ======================================== */

  /** Count each seller's listings once, rather than filtering per row. */
  function listingCountsBySeller() {
    const counts = new Map();
    for (const p of products) {
      counts.set(p.seller_id, (counts.get(p.seller_id) || 0) + 1);
    }
    return counts;
  }

  function renderUsers() {
    const counts = listingCountsBySeller();

    tabContent.innerHTML = `
      <p class="results-count">${users.length} registered user${users.length === 1 ? '' : 's'}</p>

      ${
        users.length === 0
          ? `<div class="empty-state">
               <div class="empty-icon">${icon('users', { size: 32 })}</div>
               <div class="empty-title">No users yet</div>
             </div>`
          : `
        <table class="admin-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Email</th>
              <th scope="col">Room</th>
              <th scope="col">Role</th>
              <th scope="col">Listings</th>
              <th scope="col">Status</th>
              <th scope="col">Joined</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((u) => userRow(u, counts.get(u.id) || 0)).join('')}
          </tbody>
        </table>

        <div class="admin-cards">
          ${users.map((u) => userCard(u, counts.get(u.id) || 0)).join('')}
        </div>
      `
      }
    `;
  }

  function userAvatar(user) {
    if (user.avatar_url) {
      return `<img src="${escapeHtml(user.avatar_url)}" class="avatar avatar-sm" alt="" loading="lazy" />`;
    }
    return `<span class="avatar avatar-sm avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(user.full_name))}</span>`;
  }

  function userActions(user) {
    // An admin must not be able to ban themselves out of the panel.
    const isSelf = user.id === getUser()?.id;
    return `
      <div class="listing-row-actions">
        <button class="btn btn-ghost btn-sm" data-view-listings="${user.id}">
          ${icon('package', { size: 14 })} Listings
        </button>
        ${
          isSelf
            ? '<span class="text-xs text-muted">That\'s you</span>'
            : `<button class="btn btn-ghost btn-sm" data-ban="${user.id}" data-banned="${user.is_banned}"
                       style="color: var(--color-${user.is_banned ? 'success' : 'danger'});">
                 ${icon(user.is_banned ? 'check' : 'ban', { size: 14 })}
                 ${user.is_banned ? 'Unban' : 'Ban'}
               </button>`
        }
      </div>
    `;
  }

  function userRow(user, listingCount) {
    return `
      <tr>
        <td>
          <span class="flex items-center gap-2">
            ${userAvatar(user)} ${escapeHtml(user.full_name || '—')}
          </span>
        </td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.room_number || '—')}</td>
        <td>
          <span class="badge badge-${user.role === 'admin' ? 'primary' : 'gray'}">
            ${escapeHtml(user.role)}
          </span>
        </td>
        <td>${listingCount}</td>
        <td>
          <span class="badge badge-${user.is_banned ? 'danger' : 'success'}">
            ${user.is_banned ? 'Banned' : 'Active'}
          </span>
        </td>
        <td>${escapeHtml(formatDate(user.created_at))}</td>
        <td>${userActions(user)}</td>
      </tr>
    `;
  }

  function userCard(user, listingCount) {
    return `
      <div class="admin-card">
        <div class="flex items-center gap-3 mb-4">
          ${userAvatar(user)}
          <div class="flex-1">
            <p class="font-semibold" style="margin:0;">${escapeHtml(user.full_name || '—')}</p>
            <p class="text-sm text-muted" style="margin:0;">
              ${escapeHtml(user.email)} · Room ${escapeHtml(user.room_number || '—')} ·
              ${listingCount} listing${listingCount === 1 ? '' : 's'}
            </p>
          </div>
          <span class="badge badge-${user.is_banned ? 'danger' : 'success'}">
            ${user.is_banned ? 'Banned' : 'Active'}
          </span>
        </div>
        ${userActions(user)}
      </div>
    `;
  }

  /* ========================================
     ACTIONS (delegated across all tabs)
     ======================================== */

  tabContent.addEventListener('click', async (e) => {
    // ---- Flag / unflag ----
    const flagBtn = e.target.closest('[data-flag]');
    if (flagBtn) {
      const id = flagBtn.dataset.flag;
      const currentlyFlagged = flagBtn.dataset.flagged === 'true';
      flagBtn.disabled = true;

      const { error } = await setProductFlag(id, !currentlyFlagged);
      if (error) {
        showToast('Could not update the listing', 'error');
        flagBtn.disabled = false;
        return;
      }

      const row = products.find((p) => p.id === id);
      if (row) row.is_flagged = !currentlyFlagged;

      showToast(
        currentlyFlagged
          ? 'Product unflagged and visible again'
          : 'Product flagged and hidden from the marketplace',
        currentlyFlagged ? 'success' : 'warning'
      );
      renderListingResults();
      return;
    }

    // ---- Delete a listing ----
    const deleteBtn = e.target.closest('[data-admin-delete]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.adminDelete;
      const confirmed = await showConfirmModal(
        'Delete Listing',
        'This will permanently remove this product and its images. This cannot be undone.',
        { confirmLabel: 'Delete' }
      );
      if (!confirmed) return;

      deleteBtn.disabled = true;

      const product = products.find((p) => p.id === id);
      if (product) await deleteProductMedia(product);

      const { error } = await adminDeleteProductRow(id);
      if (error) {
        showToast('Could not delete the listing', 'error');
        deleteBtn.disabled = false;
        return;
      }

      products = products.filter((p) => p.id !== id);
      showToast('Listing deleted', 'success');
      renderListingResults();
      return;
    }

    // ---- Ban / unban ----
    const banBtn = e.target.closest('[data-ban]');
    if (banBtn) {
      const id = banBtn.dataset.ban;
      const currentlyBanned = banBtn.dataset.banned === 'true';

      if (!currentlyBanned) {
        const confirmed = await showConfirmModal(
          'Ban User',
          'This will prevent the user from creating new listings. Their existing listings stay visible. Continue?',
          { confirmLabel: 'Ban User' }
        );
        if (!confirmed) return;
      }

      banBtn.disabled = true;
      const { error } = await setUserBanned(id, !currentlyBanned);
      if (error) {
        showToast('Could not update the user', 'error');
        banBtn.disabled = false;
        return;
      }

      const user = users.find((u) => u.id === id);
      if (user) user.is_banned = !currentlyBanned;

      showToast(currentlyBanned ? 'User unbanned' : 'User banned', currentlyBanned ? 'success' : 'warning');
      renderUsers();
      return;
    }

    // ---- Jump to a seller's listings ----
    const viewBtn = e.target.closest('[data-view-listings]');
    if (viewBtn) {
      listingFilters = { status: 'all', flagged: 'all', q: '', sellerId: viewBtn.dataset.viewListings };
      switchTab('listings');
    }
  });

  /* ========================================
     TABS
     ======================================== */

  function switchTab(tabId) {
    activeTab = tabId;
    container.querySelectorAll('.admin-tab').forEach((tab) => {
      const active = tab.dataset.tab === tabId;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    if (tabId === 'overview') renderOverview();
    else if (tabId === 'listings') renderListings();
    else renderUsers();
  }

  container.querySelector('.admin-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) switchTab(tab.dataset.tab);
  });

  const ok = await loadData();
  if (ok) switchTab(activeTab);
}

/**
 * Apply the listings-tab filters in memory.
 * Admins see every row including flagged ones, so this filters the already
 * fetched set rather than re-querying.
 * @param {Array} all
 * @param {Object} filters - { status, flagged, q, sellerId }
 * @returns {Array}
 */
export function filterAdminListings(all, filters) {
  return all.filter((p) => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.flagged === 'flagged' && !p.is_flagged) return false;
    if (filters.sellerId && p.seller_id !== filters.sellerId) return false;
    if (filters.q && !p.title?.toLowerCase().includes(filters.q.toLowerCase())) return false;
    return true;
  });
}
