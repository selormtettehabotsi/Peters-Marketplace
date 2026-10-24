import { isLoggedIn, isAdmin, getProfile, logOut } from '../lib/auth.js';
import { getInitials, escapeHtml } from '../lib/format.js';
import { navigate } from '../router.js';
import { icon } from './icons.js';
import { showToast } from './toast.js';

let listenersBound = false;

/**
 * Render the navbar into #navbar. Called on every route change so the
 * logged-in / logged-out state always matches the current session.
 */
export function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const loggedIn = isLoggedIn();
  const profile = getProfile();
  const admin = isAdmin();

  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="container flex items-center justify-between">
      <a href="#/" class="navbar-logo">
        <span class="logo-icon">${icon('store', { size: 26 })}</span>
        <span class="logo-text">SP Market</span>
      </a>

      <div class="search-bar hide-mobile">
        <span class="search-icon">${icon('search', { size: 18 })}</span>
        <input
          type="search"
          class="form-input"
          placeholder="Search products..."
          id="nav-search"
          aria-label="Search products"
        />
      </div>

      <div class="navbar-actions flex items-center gap-3">
        <a href="#/products" class="btn btn-ghost btn-sm hide-mobile">Browse</a>

        ${
          loggedIn
            ? `
          <a href="#/dashboard" class="btn btn-ghost btn-sm hide-mobile">Dashboard</a>
          ${admin ? '<a href="#/admin" class="btn btn-ghost btn-sm hide-mobile">Admin</a>' : ''}
          <a href="#/dashboard/new" class="btn btn-primary btn-sm hide-mobile" style="gap:4px;">
            ${icon('plus', { size: 14 })} Sell
          </a>
          <div class="avatar-dropdown hide-mobile" id="nav-avatar-menu">
            <button
              class="avatar avatar-sm avatar-placeholder"
              id="nav-avatar-btn"
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="Account menu"
            >${escapeHtml(getInitials(profile?.full_name))}</button>
          </div>
        `
            : `
          <a href="#/auth/login" class="btn btn-secondary btn-sm">Log In</a>
          <a href="#/auth/signup" class="btn btn-primary btn-sm hide-mobile">Sign Up</a>
        `
        }

        <button class="btn btn-icon btn-ghost hide-desktop" id="mobile-menu-toggle" aria-label="Open menu" aria-expanded="false">
          ${icon('menu')}
        </button>
      </div>
    </div>
  `;

  bindNavbarEvents(nav);
}

function bindNavbarEvents(nav) {
  // Search — Enter navigates to the filtered listing page
  const search = nav.querySelector('#nav-search');
  if (search) {
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const term = e.target.value.trim();
      navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
    });
  }

  // Avatar dropdown
  const avatarBtn = nav.querySelector('#nav-avatar-btn');
  if (avatarBtn) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleAvatarDropdown(nav);
    });
  }

  // Mobile hamburger
  const toggle = nav.querySelector('#mobile-menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu(toggle);
    });
  }

  // Close popovers on any outside click — bound once for the app's lifetime.
  if (!listenersBound) {
    document.addEventListener('click', closeAllMenus);
    listenersBound = true;
  }
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu, .mobile-menu').forEach((el) => el.remove());
  document
    .querySelectorAll('#nav-avatar-btn, #mobile-menu-toggle')
    .forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
}

function toggleAvatarDropdown(nav) {
  const existing = nav.querySelector('.dropdown-menu');
  closeAllMenus();
  if (existing) return;

  const profile = getProfile();
  const wrapper = nav.querySelector('#nav-avatar-menu');
  const btn = nav.querySelector('#nav-avatar-btn');
  if (!wrapper) return;

  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.innerHTML = `
    <div class="dropdown-header">
      <p class="font-semibold text-sm">${escapeHtml(profile?.full_name || 'My account')}</p>
      <p class="text-xs text-muted">${escapeHtml(profile?.email || '')}</p>
    </div>
    <a href="#/dashboard" class="dropdown-item">My Listings</a>
    <a href="#/dashboard/new" class="dropdown-item">New Listing</a>
    ${isAdmin() ? '<a href="#/admin" class="dropdown-item">Admin Panel</a>' : ''}
    <button class="dropdown-item danger" data-logout>Log Out</button>
  `;

  menu.addEventListener('click', async (e) => {
    if (e.target.closest('[data-logout]')) {
      e.stopPropagation();
      closeAllMenus();
      await logOut();
      showToast('Logged out', 'success');
      navigate('/');
      renderNavbar();
    }
  });

  wrapper.appendChild(menu);
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function toggleMobileMenu(toggle) {
  const existing = document.querySelector('.mobile-menu');
  closeAllMenus();
  if (existing) return;

  const loggedIn = isLoggedIn();
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.innerHTML = `
    <div class="search-bar" style="max-width:none;">
      <span class="search-icon">${icon('search', { size: 18 })}</span>
      <input type="search" class="form-input" id="mobile-search" placeholder="Search products..." aria-label="Search products" />
    </div>
    <a href="#/products" class="btn btn-ghost">Browse Products</a>
    ${
      loggedIn
        ? `
      <a href="#/dashboard" class="btn btn-ghost">My Dashboard</a>
      <a href="#/dashboard/new" class="btn btn-ghost">New Listing</a>
      ${isAdmin() ? '<a href="#/admin" class="btn btn-ghost">Admin Panel</a>' : ''}
      <button class="btn btn-ghost" data-logout style="color: var(--color-danger);">Log Out</button>
    `
        : `
      <a href="#/auth/login" class="btn btn-secondary">Log In</a>
      <a href="#/auth/signup" class="btn btn-primary">Sign Up</a>
    `
    }
  `;

  // One handler for the whole panel: logout and links close the menu
  // themselves, anything else (typing in the search box) must not bubble
  // out to the document-level handler that closes it.
  menu.addEventListener('click', async (e) => {
    if (e.target.closest('[data-logout]')) {
      closeAllMenus();
      await logOut();
      showToast('Logged out', 'success');
      navigate('/');
      renderNavbar();
      return;
    }

    if (e.target.closest('a')) {
      closeAllMenus();
      return;
    }

    e.stopPropagation();
  });

  const search = menu.querySelector('#mobile-search');
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const term = e.target.value.trim();
    closeAllMenus();
    navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
  });

  // Anchor the panel to the navbar's actual bottom edge, which sits lower
  // than --navbar-height whenever a banner is shown above it.
  const navbar = document.getElementById('navbar');
  const bottom = navbar ? navbar.getBoundingClientRect().bottom : 64;
  menu.style.top = `${Math.max(bottom, 0)}px`;
  menu.style.maxHeight = `calc(100vh - ${Math.max(bottom, 0)}px)`;

  document.body.appendChild(menu);
  toggle.setAttribute('aria-expanded', 'true');
}
