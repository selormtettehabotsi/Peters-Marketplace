import { getUser, getProfile, refreshProfile, isAdmin, updateProfile } from '../lib/auth.js';
import {
  fetchMyProducts,
  calculateSellerStats,
  toggleProductStatus,
  deleteProduct,
  fetchProduct,
} from '../lib/api.js';
import { deleteProductMedia, uploadAvatar, deleteAvatar, friendlyStorageError } from '../lib/storage.js';
import { validateImageFile, validateProfileUpdate } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, readForm, field, setButtonLoading } from '../lib/form-utils.js';
import { formatPrice, formatDate, escapeHtml, getInitials } from '../lib/format.js';
import { cardImageUrl } from '../components/product-card.js';
import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { watchNavigation } from '../router.js';
import { logOutAndGoHome, renderNavbar } from '../components/navbar.js';

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
        <div class="dash-avatar-wrapper" id="dash-avatar-wrapper">
          ${
            profile?.avatar_url
              ? `<img src="${escapeHtml(profile.avatar_url)}" class="avatar avatar-xl dash-avatar-img" id="dash-avatar-img" alt="${escapeHtml(profile.full_name || 'Vendor')}" />`
              : `<span class="avatar avatar-xl avatar-placeholder dash-avatar-placeholder" id="dash-avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(profile?.full_name))}</span>`
          }
          <label for="dash-avatar-input" class="dash-avatar-badge" title="Upload profile photo" aria-label="Upload profile photo">
            ${icon('camera', { size: 15 })}
            <input type="file" id="dash-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none;" />
          </label>
          <div class="dash-avatar-spinner" id="dash-avatar-spinner" hidden>
            <span class="spinner spinner-sm"></span>
          </div>
        </div>
        <div class="dash-header-text">
          <h1 class="dash-title">Hi, ${escapeHtml(profile?.full_name?.split(' ')[0] || 'seller')}</h1>
          <p class="dash-subtitle">
            ${profile?.room_number ? `Room ${escapeHtml(profile.room_number)} · ` : ''}Your listings and stats
            · <button type="button" class="btn-remove-avatar" id="edit-profile-quick-btn" style="color: var(--color-primary); font-weight: 600;">Edit profile</button>
            ${profile?.avatar_url ? ` · <button type="button" class="btn-remove-avatar" id="remove-avatar-btn">Remove photo</button>` : ''}
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
          <h2 class="section-title" style="margin-bottom: 0;">Account & Profile</h2>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-edit-profile">
            ${icon('edit', { size: 14 })} Edit Profile
          </button>
        </div>
        <div class="settings-list">
          <div class="settings-item" style="cursor: pointer;" id="item-profile-details" title="Click to edit profile">
            ${icon('user', { size: 20 })}
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; color: var(--color-ink);">${escapeHtml(profile?.full_name || 'Vendor')}</div>
              <div style="font-size: var(--font-xs); color: var(--color-ink-2);">
                ${profile?.room_number ? `Room ${escapeHtml(profile.room_number)} · ` : ''}${escapeHtml(profile?.email || '')}
              </div>
              <div style="font-size: var(--font-xs); color: var(--color-ink-2); margin-top: 4px; display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('phone', { size: 13, className: 'text-muted' })}
                  <span>${escapeHtml(profile?.phone || 'No phone')}</span>
                </span>
                <span aria-hidden="true" style="opacity: 0.4;">·</span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  ${icon('whatsapp', { size: 13, className: 'text-muted' })}
                  <span>${escapeHtml(profile?.whatsapp || profile?.phone || 'No WhatsApp')}</span>
                </span>
              </div>
            </div>
            ${icon('chevron-right', { size: 18, className: 'settings-chevron' })}
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

  // Avatar upload & removal handlers
  const avatarInput = container.querySelector('#dash-avatar-input');
  const avatarSpinner = container.querySelector('#dash-avatar-spinner');

  avatarInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      avatarInput.value = '';
      return;
    }

    try {
      if (avatarSpinner) avatarSpinner.hidden = false;
      const oldAvatarUrl = profile?.avatar_url;
      const avatarUrl = await uploadAvatar(file, user.id);
      const { error } = await updateProfile(user.id, { avatar_url: avatarUrl });

      if (error) {
        showToast(friendlyStorageError(error, 'Could not save profile picture. Please try again.'), 'error');
      } else {
        if (oldAvatarUrl) {
          await deleteAvatar(oldAvatarUrl);
        }
        showToast('Profile picture updated!', 'success');
        await refreshProfile();
        renderNavbar();
        renderDashboard(params, container);
      }
    } catch (err) {
      showToast(friendlyStorageError(err, 'Upload failed. Please try again.'), 'error');
    } finally {
      if (avatarSpinner) avatarSpinner.hidden = true;
      avatarInput.value = '';
    }
  });

  const removeAvatarBtn = container.querySelector('#remove-avatar-btn');
  removeAvatarBtn?.addEventListener('click', async () => {
    const confirmed = await showConfirmModal(
      'Remove Profile Photo',
      'Are you sure you want to remove your profile photo?',
      { confirmLabel: 'Remove' }
    );
    if (!confirmed) return;

    try {
      if (avatarSpinner) avatarSpinner.hidden = false;
      const currentUrl = profile?.avatar_url;
      if (currentUrl) await deleteAvatar(currentUrl);

      const { error } = await updateProfile(user.id, { avatar_url: null });
      if (error) {
        showToast(friendlyStorageError(error, 'Could not remove photo. Please try again.'), 'error');
      } else {
        showToast('Profile photo removed', 'success');
        await refreshProfile();
        renderNavbar();
        renderDashboard(params, container);
      }
    } catch (err) {
      showToast(friendlyStorageError(err, 'Could not remove photo. Please try again.'), 'error');
    } finally {
      if (avatarSpinner) avatarSpinner.hidden = true;
    }
  });

  // Profile editing modal handler
  const handleOpenEditProfile = () => {
    openEditProfileModal(profile, async () => {
      await refreshProfile();
      renderNavbar();
      renderDashboard(params, container);
    });
  };

  container.querySelector('#edit-profile-quick-btn')?.addEventListener('click', handleOpenEditProfile);
  container.querySelector('#btn-edit-profile')?.addEventListener('click', handleOpenEditProfile);
  container.querySelector('#item-profile-details')?.addEventListener('click', handleOpenEditProfile);

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

/**
 * Modal to edit vendor profile (Full Name, Room Number, Phone, WhatsApp).
 * @param {Object} currentProfile
 * @param {Function} onSaved - callback after successful update
 */
function openEditProfileModal(currentProfile, onSaved) {
  const container = document.getElementById('modal-container') || document.body;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'edit-profile-modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Edit Profile">
      <div class="modal-header">
        <h3>Edit Profile</h3>
        <button class="btn btn-icon btn-ghost" data-modal-close aria-label="Close dialog">
          ${icon('close')}
        </button>
      </div>
      <form id="edit-profile-form" novalidate>
        <div class="modal-body">
          <p style="font-size: var(--font-sm); color: var(--color-ink-2); margin-bottom: var(--space-4);">
            Update your seller info. Buyers at St. Peter's Hostel use this to contact and locate you.
          </p>
          ${field({
            name: 'fullName',
            label: 'Full Name',
            value: currentProfile?.full_name || '',
            placeholder: 'e.g. Kwame Mensah',
            required: true,
          })}
          ${field({
            name: 'roomNumber',
            label: 'Room Number',
            value: currentProfile?.room_number || '',
            placeholder: 'e.g. B204',
            required: true,
          })}
          ${field({
            name: 'phone',
            label: 'Phone Number',
            type: 'tel',
            value: currentProfile?.phone || '',
            placeholder: 'e.g. 0555586125',
            required: true,
          })}
          ${field({
            name: 'whatsapp',
            label: 'WhatsApp Number',
            type: 'tel',
            value: currentProfile?.whatsapp || currentProfile?.phone || '',
            placeholder: 'e.g. 0555586125',
            hint: 'Defaults to phone number if left identical',
          })}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary" id="save-profile-btn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  `;

  const close = () => {
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
  };

  const onKeydown = (e) => {
    if (e.key === 'Escape') close();
  };

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop || e.target.closest('[data-modal-close]')) {
      close();
    }
  });

  const form = backdrop.querySelector('#edit-profile-form');
  const submitBtn = backdrop.querySelector('#save-profile-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const fullName = values.fullName?.trim() || '';
    const roomNumber = values.roomNumber?.trim() || '';
    const phone = values.phone?.trim() || '';
    const whatsapp = values.whatsapp?.trim() || phone;

    const errors = validateProfileUpdate({
      fullName,
      roomNumber,
      phone,
      whatsapp,
    });

    if (applyErrors(form, errors)) return;

    const restore = setButtonLoading(submitBtn, 'Saving…');
    try {
      const user = getUser();
      const { error } = await updateProfile(user.id, {
        full_name: fullName,
        room_number: roomNumber,
        phone,
        whatsapp,
      });

      if (error) {
        showToast(friendlyStorageError(error, 'Could not update profile. Please try again.'), 'error');
        restore();
      } else {
        showToast('Profile updated successfully!', 'success');
        close();
        if (onSaved) await onSaved();
      }
    } catch (err) {
      showToast(friendlyStorageError(err, 'Failed to update profile.'), 'error');
      restore();
    }
  });

  document.addEventListener('keydown', onKeydown);
  container.appendChild(backdrop);

  const firstInput = form.querySelector('input');
  if (firstInput) firstInput.focus();
}
