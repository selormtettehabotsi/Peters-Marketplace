// Import styles
import './styles/index.css';

import { addRoute, setNotFound, initRouter, onNavigate } from './router.js';
import { initAuth, onAuthChange } from './lib/auth.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { icon } from './components/icons.js';
import { isConfigured } from './supabase.js';

// Pages
import renderHome from './pages/home.js';
import renderProducts from './pages/products.js';
import renderProductDetail from './pages/product-detail.js';
import renderLogin from './pages/login.js';
import renderSignup from './pages/signup.js';
import renderDashboard from './pages/dashboard.js';
import { renderNewListing, renderEditListing } from './pages/dashboard-form.js';
import renderAdmin from './pages/admin.js';
import { authGuard } from './components/auth-guard.js';

/** Register every route in the app. */
function registerRoutes() {
  addRoute('/', renderHome);
  addRoute('/products', renderProducts);
  addRoute('/products/:id', renderProductDetail);
  addRoute('/category/:name', (params, container) =>
    renderProducts({ query: { category: params.name } }, container)
  );

  addRoute('/auth/login', renderLogin);
  addRoute('/auth/signup', renderSignup);

  // The route options gate dispatch; authGuard wraps the handler itself so a
  // page can never render unauthenticated even if invoked some other way.
  addRoute('/dashboard', authGuard(renderDashboard), { requiresAuth: true });
  addRoute('/dashboard/new', authGuard(renderNewListing), { requiresAuth: true });
  addRoute('/dashboard/edit/:id', authGuard(renderEditListing), { requiresAuth: true });

  addRoute('/admin', authGuard(renderAdmin, { requireAdmin: true }), {
    requiresAuth: true,
    requiresAdmin: true,
  });

  setNotFound((params, container) => {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">${icon('search', { size: 32 })}</div>
          <div class="empty-title">Page Not Found</div>
          <div class="empty-description">The page you're looking for doesn't exist.</div>
          <a href="#/" class="btn btn-primary">Go Home</a>
        </div>
      </div>
    `;
  });
}

/** Banner shown while the app still has placeholder Supabase keys. */
function renderConfigNotice() {
  if (isConfigured) return;
  const app = document.getElementById('app');
  const banner = document.createElement('div');
  banner.className = 'config-banner';
  banner.innerHTML = `
    ${icon('alert', { size: 16 })}
    <strong>Supabase not configured.</strong>
    Add your project URL and anon key in <code>src/supabase.js</code> to load real data.
  `;
  app.prepend(banner);
}

/** Show a banner whenever the browser goes offline. */
function watchConnection() {
  let banner = null;

  const update = () => {
    if (navigator.onLine) {
      banner?.remove();
      banner = null;
      return;
    }
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.innerHTML = `${icon('wifi_off', { size: 16 })} You're offline — showing cached content`;
    document.body.appendChild(banner);
  };

  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/* ========================================
   PWA Install Prompt (Module 08, Part 6)
   Capture the browser's install event and
   show a custom banner instead of the
   browser-default mini-infobar.
   ======================================== */
let deferredPrompt = null;

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the browser's default mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });
}

function showInstallBanner() {
  // Don't show twice
  if (document.querySelector('.install-banner')) return;

  const banner = document.createElement('div');
  banner.className = 'install-banner animate-slide-up';
  banner.innerHTML = `
    <div class="container flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="install-banner-icon">${icon('store', { size: 22 })}</span>
        <div>
          <p class="font-semibold text-sm" style="margin:0;">Install SP Market</p>
          <p class="text-xs text-muted" style="margin:0;">Add to home screen for quick access</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" id="install-dismiss">Later</button>
        <button class="btn btn-primary btn-sm" id="install-accept">Install</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('install-accept').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.remove();
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
  });

  document.getElementById('install-dismiss').addEventListener('click', () => {
    banner.remove();
  });
}

/** App initialization. */
async function initApp() {
  renderConfigNotice();
  renderFooter();

  // Resolve the session before the first route runs, so guarded routes
  // don't bounce a logged-in user to the login page on a hard refresh.
  await initAuth();

  renderNavbar();
  onAuthChange(() => renderNavbar());
  onNavigate(() => {
    renderNavbar();
    // Overlays live on document.body, so replacing #page-content does not
    // remove them. Close them explicitly, which also frees their listeners.
    document.querySelectorAll('.gallery-lightbox').forEach((box) => {
      if (typeof box.close === 'function') box.close();
      else box.remove();
    });
  });

  registerRoutes();
  initRouter();
  watchConnection();
  setupInstallPrompt();
}

initApp();
