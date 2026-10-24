import { getUser, getProfile, refreshProfile, isAdmin } from '../lib/auth.js';
import {
  fetchMyProducts,
  calculateSellerStats,
  toggleProductStatus,
  deleteProduct,
  fetchProduct,
} from '../lib/api.js';
import { deleteProductMedia } from '../lib/storage.js';
import { formatPrice, formatDate, escapeHtml, getInitials } from '../lib/format.js';
import { cardImageUrl } from '../components/product-card.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { watchNavigation } from '../router.js';
import { logOutAndGoHome } from '../components/navbar.js';

const STAT_TILES = [
  { key: 'total', label: 'Total Listings', icon: 'package' },
  { key: 'available', label: 'Available', icon: 'check-circle' },
  { key: 'sold', label: 'Sold', icon: 'tag' },
  { key: 'totalViews', label: 'Total Views', icon: 'eye' },
];

/**
 * Seller dashboard — stats and listing management.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default async function renderDashboard(params, container) {
  const user = getUser();
  const isStale = watchNavigation();

  // Re-read the profile from the server: an admin may have banned this
  // seller since the session started, and the suspension notice below has
  // to reflect that rather than the stale copy cached at login.
  await refreshProfile();
  if (isStale()) return;

  const profile = getProfile();

  container.innerHTML = `
    <div class="container section-sm dashboard">
      <header class="dash-header">
        <span class="avatar avatar-lg avatar-placeholder" aria-hidden="true">
          ${escapeHtml(getInitials(profile?.full_name))}
        </span>
        <div class="dash-header-text">
          <h1 class="dash-title">Hi, ${escapeHtml(profile?.full_name?.split(' ')[0] || 'seller')}</h1>
          <p class="dash-subtitle">
            ${profile?.room_number ? `Room ${escapeHtml(profile.room_number)} · ` : ''}Your listings and stats
          </p>
        </div>
        <a href="#/dashboard/new" class="btn btn-primary hide-mobile${profile?.is_banned ? ' disabled' : ''}">
          ${icon('plus', { size: 16 })} New Listing
        </a>
      </header>

      ${
        profile?.is_banned
          ? `<div class="sold-notice" style="margin-bottom: var(--space-6);">
               Your account is suspended. You can view your listings but cannot create new ones.
             </div>`
          : ''
      }

      <div class="stats-row" id="stats-row">
        ${STAT_TILES.map(
          (tile) => `
          <div class="stat-card">
            <span class="stat-icon">${icon(tile.icon, { size: 18 })}</span>
            <div>
              <div class="stat-value" data-stat="${tile.key}">0</div>
              <div class="stat-label">${tile.label}</div>
            </div>
          </div>
        `
        ).join('')}
      </div>

      <section class="dash-section">
        <h2 class="section-title">My listings</h2>
        <div id="listings-area">
          <div class="skeleton" style="height:96px; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height:96px; margin-bottom: var(--space-3);"></div>
          <div class="skeleton" style="height:96px;"></div>
        </div>
      </section>

      <section class="dash-section">
        <h2 class="section-title">Account</h2>
        <div class="settings-list">
          <div class="settings-item">
            ${icon('user', { size: 20 })}
            <span class="settings-label">${escapeHtml(profile?.email || '')}</span>
          </div>
          ${
            isAdmin()
              ? `<a href="#/admin" class="settings-item">
                   ${icon('chart', { size: 20 })}
                   <span class="settings-label">Admin panel</span>
                   ${icon('chevron-right', { size: 18, className: 'settings-chevron' })}
                 </a>`
              : ''
          }
          <button type="button" class="settings-item settings-danger" data-logout>
            ${icon('logout', { size: 20 })}
            <span class="settings-label">Log out</span>
          </button>
        </div>
      </section>
    </div>
  `;

  container.querySelector('[data-logout]').addEventListener('click', logOutAndGoHome);

  const area = container.querySelector('#listings-area');

  async function refreshListings() {
    const { products, error } = await fetchMyProducts(user.id);
    if (isStale()) return;

    if (error) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${icon('wifi_off', { size: 32 })}</div>
          <div class="empty-title">Couldn't load your listings</div>
          <div class="empty-description">Check your connection and try again.</div>
        </div>
      `;
      return;
    }

    // Stats
    const stats = calculateSellerStats(products);
    for (const tile of STAT_TILES) {
      const el = container.querySelector(`[data-stat="${tile.key}"]`);
      if (el) el.textContent = String(stats[tile.key]);
    }

    if (products.length === 0) {
      area.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${icon('package', { size: 32 })}</div>
          <div class="empty-title">You haven't listed anything yet</div>
          <div class="empty-description">Start selling to your hostel mates. It takes a minute.</div>
          <a href="#/dashboard/new" class="btn btn-primary">
            ${icon('plus', { size: 16 })} Create Your First Listing
          </a>
        </div>
      `;
      return;
    }

    area.innerHTML = `
      <ul class="listing-list">
        ${products.map((p) => listingItem(p)).join('')}
      </ul>
    `;
  }

  function statusBadge(product) {
    const sold = product.status === 'sold';
    return `<span class="badge badge-${sold ? 'danger' : 'success'}">${sold ? 'Sold' : 'Available'}</span>`;
  }

  function actionButtons(product) {
    const sold = product.status === 'sold';
    return `
      <div class="listing-actions">
        <a href="#/dashboard/edit/${product.id}" class="listing-action" aria-label="Edit ${escapeHtml(product.title)}">
          ${icon('edit', { size: 16 })} <span>Edit</span>
        </a>
        <button class="listing-action" data-toggle="${product.id}" data-status="${product.status}">
          ${icon(sold ? 'check-circle' : 'tag', { size: 16 })} <span>${sold ? 'Relist' : 'Mark sold'}</span>
        </button>
        <button class="listing-action listing-action-danger" data-delete="${product.id}"
                aria-label="Delete ${escapeHtml(product.title)}">
          ${icon('trash', { size: 16 })} <span>Delete</span>
        </button>
      </div>
    `;
  }

  function listingItem(product) {
    return `
      <li class="listing-item${product.status === 'sold' ? ' is-sold' : ''}">
        <a href="#/products/${product.id}" class="listing-main">
          <img src="${escapeHtml(cardImageUrl(product))}" class="listing-thumb" alt="" loading="lazy" />
          <div class="listing-info">
            <p class="listing-price">${escapeHtml(formatPrice(product.price))}</p>
            <p class="listing-title line-clamp-2">${escapeHtml(product.title)}</p>
            <p class="listing-meta">
              ${statusBadge(product)}
              <span>${Number(product.views_count || 0)} views · ${escapeHtml(formatDate(product.created_at))}</span>
            </p>
          </div>
        </a>
        ${actionButtons(product)}
      </li>
    `;
  }

  // Event delegation covers both the table and the mobile cards.
  area.addEventListener('click', async (e) => {
    const toggleBtn = e.target.closest('[data-toggle]');
    if (toggleBtn) {
      const id = toggleBtn.dataset.toggle;
      const current = toggleBtn.dataset.status;
      toggleBtn.disabled = true;

      const { status, error } = await toggleProductStatus(id, user.id, current);
      if (error) {
        showToast('Could not update the listing', 'error');
        toggleBtn.disabled = false;
        return;
      }

      showToast(`Product marked as ${status}`, 'success');
      await refreshListings();
      return;
    }

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn) {
      const id = deleteBtn.dataset.delete;
      const confirmed = await showConfirmModal(
        'Delete Listing',
        'Are you sure? This will permanently remove this listing and all its images.',
        { confirmLabel: 'Delete' }
      );
      if (!confirmed) return;

      deleteBtn.disabled = true;

      // Remove the stored media first, then the row itself.
      const { product } = await fetchProduct(id);
      if (product) await deleteProductMedia(product);

      const { error } = await deleteProduct(id, user.id);
      if (error) {
        showToast('Could not delete the listing', 'error');
        deleteBtn.disabled = false;
        return;
      }

      showToast('Listing deleted', 'success');
      await refreshListings();
    }
  });

  await refreshListings();
}
