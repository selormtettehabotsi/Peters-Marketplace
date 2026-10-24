import { getUser, getProfile, refreshProfile } from '../lib/auth.js';
import {
  fetchMyProducts,
  calculateSellerStats,
  toggleProductStatus,
  deleteProduct,
  fetchProduct,
} from '../lib/api.js';
import { deleteProductMedia } from '../lib/storage.js';
import { formatPrice, formatDate, escapeHtml } from '../lib/format.js';
import { cardImageUrl } from '../components/product-card.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { watchNavigation } from '../router.js';

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
    <div class="container section-sm">
      <div class="page-header">
        <h1 class="page-title">My Dashboard</h1>
        <p class="page-subtitle">
          Welcome, ${escapeHtml(profile?.full_name || 'seller')}${
            profile?.room_number ? ` (Room ${escapeHtml(profile.room_number)})` : ''
          }
        </p>
      </div>

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
            <span class="stat-icon">${icon(tile.icon, { size: 20 })}</span>
            <div class="stat-value" data-stat="${tile.key}">0</div>
            <div class="stat-label">${tile.label}</div>
          </div>
        `
        ).join('')}
      </div>

      <div class="flex items-center justify-between mb-6">
        <h2 class="h3">My Listings</h2>
        <a href="#/dashboard/new" class="btn btn-primary${profile?.is_banned ? ' disabled' : ''}">
          ${icon('plus', { size: 16 })} New Listing
        </a>
      </div>

      <div id="listings-area">
        <div class="skeleton skeleton-text" style="height:3em;"></div>
        <div class="skeleton skeleton-text" style="height:3em;"></div>
        <div class="skeleton skeleton-text" style="height:3em;"></div>
      </div>
    </div>
  `;

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
      <table class="admin-table">
        <thead>
          <tr>
            <th scope="col">Image</th>
            <th scope="col">Title</th>
            <th scope="col">Price</th>
            <th scope="col">Status</th>
            <th scope="col">Views</th>
            <th scope="col">Created</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p) => listingRow(p)).join('')}
        </tbody>
      </table>

      <div class="admin-cards">
        ${products.map((p) => listingCard(p)).join('')}
      </div>
    `;
  }

  function statusBadge(product) {
    const sold = product.status === 'sold';
    return `<span class="badge badge-${sold ? 'danger' : 'success'}">${sold ? 'Sold' : 'Available'}</span>`;
  }

  function actionButtons(product) {
    const sold = product.status === 'sold';
    return `
      <div class="listing-row-actions">
        <a href="#/dashboard/edit/${product.id}" class="btn btn-ghost btn-sm" aria-label="Edit ${escapeHtml(product.title)}">
          ${icon('edit', { size: 14 })} Edit
        </a>
        <button class="btn btn-ghost btn-sm" data-toggle="${product.id}" data-status="${product.status}">
          ${icon(sold ? 'check-circle' : 'tag', { size: 14 })} ${sold ? 'Mark Available' : 'Mark Sold'}
        </button>
        <button class="btn btn-ghost btn-sm" data-delete="${product.id}"
                style="color: var(--color-danger);" aria-label="Delete ${escapeHtml(product.title)}">
          ${icon('trash', { size: 14 })} Delete
        </button>
      </div>
    `;
  }

  function listingRow(product) {
    return `
      <tr>
        <td><img src="${escapeHtml(cardImageUrl(product))}" class="thumb" alt="" loading="lazy" /></td>
        <td>
          <a href="#/products/${product.id}" class="font-medium">${escapeHtml(product.title)}</a>
        </td>
        <td>${escapeHtml(formatPrice(product.price))}</td>
        <td>${statusBadge(product)}</td>
        <td>${Number(product.views_count || 0)}</td>
        <td>${escapeHtml(formatDate(product.created_at))}</td>
        <td>${actionButtons(product)}</td>
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
              ${escapeHtml(formatPrice(product.price))} ·
              ${Number(product.views_count || 0)} views
            </p>
          </div>
          ${statusBadge(product)}
        </div>
        ${actionButtons(product)}
      </div>
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
