/**
 * Simple hash-based SPA router.
 * Routes are defined as { path, handler, requiresAuth, requiresAdmin }
 */

import { isLoggedIn, isAdmin } from './lib/auth.js';

const routes = [];
let notFoundHandler = null;
let beforeEach = null;

// Bumped on every navigation. A page handler that awaits a slow fetch can
// finish after the user has already moved on; without this it would write
// its result into whatever page is now on screen.
let navigationId = 0;

/**
 * Capture the current navigation and get back a staleness check.
 * Call the returned function after every await, before touching the DOM:
 *
 *   const isStale = watchNavigation();
 *   const data = await fetch(...);
 *   if (isStale()) return;
 *
 * @returns {() => boolean}
 */
export function watchNavigation() {
  const id = navigationId;
  return () => id !== navigationId;
}

/**
 * Register a route.
 * @param {string} path - URL path pattern (e.g., '/products/:id')
 * @param {Function} handler - async function(params, container) that renders the page
 * @param {Object} options - { requiresAuth, requiresAdmin }
 */
export function addRoute(path, handler, options = {}) {
  routes.push({
    path,
    handler,
    requiresAuth: options.requiresAuth || false,
    requiresAdmin: options.requiresAdmin || false,
    // Convert path pattern to regex
    regex: pathToRegex(path),
    paramNames: extractParamNames(path),
  });
}

/**
 * Set the 404 handler.
 */
export function setNotFound(handler) {
  notFoundHandler = handler;
}

/**
 * Register a callback that runs after every successful navigation.
 * Used to re-render the navbar so it reflects the current auth state.
 * @param {Function} callback - function(path)
 */
export function onNavigate(callback) {
  beforeEach = callback;
}

/**
 * Navigate to a new route.
 * @param {string} path - e.g., '/products/abc-123'
 */
export function navigate(path) {
  const target = '#' + path;
  if (window.location.hash === target) {
    // Same hash fires no hashchange event — re-render manually.
    handleRoute();
    return;
  }
  window.location.hash = target;
}

/**
 * Initialize the router. Call once on app start.
 */
export function initRouter() {
  // Handle hash changes
  window.addEventListener('hashchange', handleRoute);

  // Handle initial load
  handleRoute();

  // Intercept link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#/"]');
    if (link) {
      e.preventDefault();
      const path = link.getAttribute('href').substring(1); // Remove '#'
      navigate(path);
    }
  });
}

/**
 * Get current path from hash, without the query string.
 */
export function getCurrentPath() {
  const hash = window.location.hash.slice(1); // Remove '#'
  const path = hash.split('?')[0];
  return path || '/';
}

/**
 * Parse the query string of the current hash into a plain object.
 * '#/products?q=phone&sort=newest' → { q: 'phone', sort: 'newest' }
 * @returns {Object<string, string>}
 */
export function getQueryParams() {
  const hash = window.location.hash.slice(1);
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) return {};
  return Object.fromEntries(new URLSearchParams(hash.slice(queryIndex + 1)));
}

/**
 * Match current URL to a route and execute its handler.
 */
export async function handleRoute() {
  const path = getCurrentPath();

  // Invalidate any in-flight handler from the page we are leaving.
  navigationId += 1;
  const currentNavigation = navigationId;

  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      // Extract params
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      params.query = getQueryParams();

      // Auth check
      if (route.requiresAuth && !isLoggedIn()) {
        navigate('/auth/login');
        return;
      }

      // Admin check
      if (route.requiresAdmin && !isAdmin()) {
        navigate('/');
        return;
      }

      // Execute handler
      const content = document.getElementById('page-content');
      try {
        await route.handler(params, content);
      } catch (error) {
        console.error('Route handler error:', error);
        // Only report the failure if this route is still the one on screen.
        if (currentNavigation === navigationId) {
          content.innerHTML =
            '<div class="empty-state"><div class="empty-title">Something went wrong</div><div class="empty-description">Please check your connection and try again.</div></div>';
        }
      }

      // A newer navigation started while this handler was awaiting — leave
      // the newer page alone.
      if (currentNavigation !== navigationId) return;

      if (beforeEach) beforeEach(path);

      // Scroll to top on navigation
      window.scrollTo(0, 0);
      return;
    }
  }

  // No route matched — 404
  if (notFoundHandler) {
    const content = document.getElementById('page-content');
    notFoundHandler({}, content);
    if (beforeEach) beforeEach(path);
  }
}

/**
 * Convert a path pattern like '/products/:id' to a regex.
 */
export function pathToRegex(path) {
  const pattern = path
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, '([^/]+)');
  return new RegExp('^' + pattern + '$');
}

/**
 * Extract parameter names from a path pattern.
 */
export function extractParamNames(path) {
  const names = [];
  const regex = /:(\w+)/g;
  let match;
  while ((match = regex.exec(path)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/** Remove every registered route — test helper. */
export function _resetRoutes() {
  routes.length = 0;
  notFoundHandler = null;
  beforeEach = null;
}
