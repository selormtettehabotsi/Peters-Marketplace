/**
 * Where the installed app (PWA) should open.
 *
 * Phones don't always open an installed web app at the manifest's
 * start_url: iOS "Add to Home Screen" keeps the page you were on when you
 * added it (often the signup page), and Android can resume the last screen.
 * Buyers don't need an account, so a fresh launch should land on the
 * listings, not on a login or signup form.
 */

/** Screen a fresh app launch opens on. */
export const LAUNCH_PATH = '/products';

/** Routes that need an account; opening one logged out would bounce to login. */
const MEMBERS_ONLY = [/^\/dashboard(\/|$)/, /^\/admin(\/|$)/];

/**
 * Decide whether a fresh launch should be redirected, and where.
 * Pure, so it can be unit-tested without a browser.
 * @param {string} path - current route path, e.g. '/auth/signup'
 * @param {Object} context
 * @param {boolean} context.standalone - running as the installed app
 * @param {boolean} context.freshLaunch - first route of this app session
 * @param {boolean} context.loggedIn
 * @returns {string|null} path to open instead, or null to stay
 */
export function launchRedirect(path, { standalone, freshLaunch, loggedIn }) {
  if (!standalone || !freshLaunch) return null;

  const p = path || '/';
  if (p === '/' || p.startsWith('/auth/')) return LAUNCH_PATH;
  if (!loggedIn && MEMBERS_ONLY.some((re) => re.test(p))) return LAUNCH_PATH;
  return null; // e.g. a shared link to one product: open it as-is
}

/** True when running as an installed app rather than in a browser tab. */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  const mm = (q) => typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  return (
    mm('(display-mode: standalone)') ||
    mm('(display-mode: fullscreen)') ||
    mm('(display-mode: minimal-ui)') ||
    window.navigator.standalone === true // iOS Safari
  );
}

/**
 * True only for the first route of an app session. sessionStorage survives
 * in-app navigation and reloads but starts empty on a cold launch.
 */
export function consumeFreshLaunch() {
  try {
    if (sessionStorage.getItem('sp-launched')) return false;
    sessionStorage.setItem('sp-launched', '1');
    return true;
  } catch {
    return true; // storage blocked: treat as fresh, the redirect is harmless
  }
}
