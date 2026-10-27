import { isLoggedIn, isAdmin, getProfile, logOut } from '../lib/auth.js';
import { getInitials, escapeHtml } from '../lib/format.js';
import { navigate, getCurrentPath } from '../router.js';
import { icon } from './icons.js';
import { showToast } from './toast.js';

let listenersBound = false;

/** "Kotei, Kumasi · Sat 24 Oct 2026" — the newspaper-style dateline. */
function dateline() {
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `Kotei, Kumasi · ${date.replace(',', '')}`;
}

/**
 * Screens that hide the mobile tab bar: focused tasks (auth, the listing
 * form) and the product page, whose own sticky contact bar takes the
 * bottom edge.
 */
const TABBAR_HIDDEN = [/^\/auth\//, /^\/products\/[^/]+$/, /^\/dashboard\/(new|edit)/];

/**
 * Render the navbar into #navbar and the mobile tab bar. Called on every
 * route change so the logged-in / logged-out state and the active tab
 * always match the current session and screen.
 */
export function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const loggedIn = isLoggedIn();
  const profile = getProfile();
  const admin = isAdmin();
  // The login/signup screens are the call to action; don't repeat it above them.
  const onAuthScreen = getCurrentPath().startsWith('/auth/');
  // The home page has its own big masthead, so the bar shows a dateline.
  const onHome = getCurrentPath() === '/';

  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="container flex items-center justify-between">
      <a href="#/" class="navbar-brand${onHome ? ' show-dateline' : ''}" aria-label="SP Market home">
        <span class="navbar-logo" aria-hidden="true">SP <span class="logo-accent">Market</span></span>
        ${onHome ? `<span class="navbar-kicker" aria-hidden="true">${escapeHtml(dateline())}</span>` : ''}
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
              class="avatar avatar-sm${profile?.avatar_url ? '' : ' avatar-placeholder'}"
              id="nav-avatar-btn"
              aria-haspopup="true"
              aria-expanded="false"
              aria-label="Account menu"
              style="padding:0; overflow:hidden;"
            >${
              profile?.avatar_url
                ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.full_name || 'Account')}" style="width:100%; height:100%; object-fit:cover; display:block;" />`
                : escapeHtml(getInitials(profile?.full_name))
            }</button>
          </div>
        `
            : onAuthScreen
              ? ''
              : `
          <a href="#/auth/login" class="btn btn-secondary btn-sm hide-mobile">Log In</a>
          <a href="#/auth/signup" class="btn btn-primary btn-sm hide-mobile">Sign Up</a>
        `
        }
      </div>
    </div>
  `;

  bindNavbarEvents(nav);
  watchMasthead(nav, onHome);
  renderTabBar();
}

let mastheadObserver = null;

/**
 * On the home page the bar shows the dateline while the big masthead is on
 * screen, and swaps to the SP MARKET wordmark once it scrolls away.
 */
function watchMasthead(nav, onHome) {
  mastheadObserver?.disconnect();
  mastheadObserver = null;

  const brand = nav.querySelector('.navbar-brand');
  const masthead = document.querySelector('.masthead-title');
  if (!onHome || !brand || !masthead || typeof IntersectionObserver === 'undefined') return;

  mastheadObserver = new IntersectionObserver(
    ([entry]) => brand.classList.toggle('show-dateline', entry.isIntersecting),
    // Count the masthead as gone once it's behind the sticky bar
    { rootMargin: `-${nav.offsetHeight || 64}px 0px 0px 0px` }
  );
  mastheadObserver.observe(masthead);
}

/**
 * Mobile bottom navigation — the thumb-reachable way around the app on
 * phones. Hidden above 768px by CSS, and on the screens in TABBAR_HIDDEN.
 */
export function renderTabBar() {
  let bar = document.getElementById('tabbar');
  if (!bar) {
    bar = document.createElement('nav');
    bar.id = 'tabbar';
    bar.className = 'tabbar';
    bar.setAttribute('aria-label', 'Main');
    document.body.appendChild(bar);
  }

  const path = getCurrentPath();
  const hidden = TABBAR_HIDDEN.some((re) => re.test(path));
  bar.hidden = hidden;
  document.body.classList.toggle('has-tabbar', !hidden);
  if (hidden) return;

  const loggedIn = isLoggedIn();
  const tabs = [
    { href: '#/', label: 'Home', icon: 'home', active: path === '/' },
    {
      href: '#/products',
      label: 'Browse',
      icon: 'search',
      active: path === '/products' || path.startsWith('/category/'),
    },
    {
      href: loggedIn ? '#/dashboard/new' : '#/auth/signup',
      label: 'Sell',
      icon: 'plus',
      primary: true,
    },
    loggedIn
      ? {
          href: '#/dashboard',
          label: 'Account',
          icon: 'user',
          active: path === '/dashboard' || path === '/admin',
        }
      : { href: '#/auth/login', label: 'Log in', icon: 'login' },
  ];

  bar.innerHTML = tabs
    .map(
      (t) => `
      <a href="${t.href}" class="tabbar-item${t.primary ? ' tabbar-sell' : ''}${t.active ? ' active' : ''}"
         ${t.active ? 'aria-current="page"' : ''}>
        <span class="tabbar-icon">${icon(t.icon, { size: t.primary ? 24 : 22 })}</span>
        <span class="tabbar-label">${t.label}</span>
      </a>
    `
    )
    .join('');
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

  // Close the dropdown on any outside click — bound once for the app's lifetime.
  if (!listenersBound) {
    document.addEventListener('click', closeAllMenus);
    listenersBound = true;
  }
}

function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu').forEach((el) => el.remove());
  document
    .querySelectorAll('#nav-avatar-btn')
    .forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
}

/** Log out from anywhere in the app and return home. */
export async function logOutAndGoHome() {
  closeAllMenus();
  await logOut();
  showToast('Logged out', 'success');
  navigate('/');
  renderNavbar();
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
    <div class="dropdown-header flex items-center gap-3">
      ${
        profile?.avatar_url
          ? `<img src="${escapeHtml(profile.avatar_url)}" class="avatar avatar-sm" alt="" style="object-fit:cover; flex-shrink:0;" />`
          : `<span class="avatar avatar-sm avatar-placeholder" style="flex-shrink:0;">${escapeHtml(getInitials(profile?.full_name))}</span>`
      }
      <div style="min-width:0; flex:1;">
        <p class="font-semibold text-sm truncate" style="margin:0;">${escapeHtml(profile?.full_name || 'My account')}</p>
        <p class="text-xs text-muted truncate" style="margin:0;">${escapeHtml(profile?.email || '')}</p>
      </div>
    </div>
    <a href="#/dashboard" class="dropdown-item">My Listings</a>
    <a href="#/dashboard/new" class="dropdown-item">New Listing</a>
    ${isAdmin() ? '<a href="#/admin" class="dropdown-item">Admin Panel</a>' : ''}
    <button class="dropdown-item danger" data-logout>Log Out</button>
  `;

  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-logout]')) {
      e.stopPropagation();
      logOutAndGoHome();
    }
  });

  wrapper.appendChild(menu);
  if (btn) btn.setAttribute('aria-expanded', 'true');
}
