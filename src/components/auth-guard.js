import { isLoggedIn, isAdmin } from '../lib/auth.js';
import { navigate } from '../router.js';

/**
 * Protects a page handler — redirects to login if not authenticated.
 * The router performs the same check before dispatch; this wrapper guards
 * handlers that are invoked directly (and documents each page's requirement).
 * @param {Function} pageHandler - The page function to protect
 * @param {Object} options - { requireAdmin: false }
 * @returns {Function}
 */
export function authGuard(pageHandler, options = {}) {
  return async (params, container) => {
    if (!isLoggedIn()) {
      navigate('/auth/login');
      return;
    }

    if (options.requireAdmin && !isAdmin()) {
      navigate('/');
      return;
    }

    return pageHandler(params, container);
  };
}
