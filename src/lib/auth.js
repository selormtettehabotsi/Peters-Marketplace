import { supabase } from '../supabase.js';

// Current user state
let currentUser = null;
let currentProfile = null;
let authListeners = [];

/**
 * Initialize auth — call once on app start.
 * Checks for existing session and sets up auth state listener.
 */
export async function initAuth() {
  // Check for existing session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      await fetchProfile(session.user.id);
    }
  } catch (error) {
    // No reachable backend yet (placeholder keys) — stay logged out.
    console.warn('Auth session check failed:', error.message);
  }

  // Listen for auth changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
      currentUser = session.user;
      await fetchProfile(session.user.id);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
    }
    notifyListeners();
  });
}

/**
 * Fetch the user's profile from the profiles table.
 */
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!error && data) {
    currentProfile = data;
  }
}

/**
 * Reload the current user's profile from the database.
 * Call after a profile-changing action (e.g. being granted admin).
 */
export async function refreshProfile() {
  if (currentUser) await fetchProfile(currentUser.id);
  return currentProfile;
}

/**
 * Translate a raw Supabase auth error into something a student can act on.
 * @param {string} message
 * @returns {string}
 */
export function friendlyAuthError(message) {
  if (!message) return 'Something went wrong. Please try again.';
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already exists') || m.includes('duplicate')) {
    return 'An account with this email already exists';
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Incorrect email or password';
  }
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch')) {
    return 'Network error. Please check your connection';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email address before logging in';
  }
  if (m.includes('password')) {
    return 'Password must be at least 6 characters';
  }
  return message;
}

/**
 * Sign up a new user.
 * @param {Object} params - { email, password, fullName, phone, whatsapp, roomNumber }
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function signUp({ email, password, fullName, phone, whatsapp, roomNumber }) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
          whatsapp: whatsapp || phone, // Default WhatsApp to phone if not provided
          room_number: roomNumber,
        },
      },
    });

    if (error) return { user: null, error: friendlyAuthError(error.message) };
    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: friendlyAuthError(error.message) };
  }
}

/**
 * Log in an existing user.
 * Banned accounts are signed straight back out.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function logIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { user: null, error: friendlyAuthError(error.message) };

    currentUser = data.user;
    await fetchProfile(data.user.id);

    if (currentProfile?.is_banned) {
      await logOut();
      return { user: null, error: 'Your account has been suspended' };
    }

    notifyListeners();
    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: friendlyAuthError(error.message) };
  }
}

/**
 * Log out the current user.
 */
export async function logOut() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('Sign out failed:', error.message);
  }
  currentUser = null;
  currentProfile = null;
  notifyListeners();
}

/**
 * Get the current user (from Supabase Auth).
 * @returns {Object|null}
 */
export function getUser() {
  return currentUser;
}

/**
 * Get the current user's profile (from profiles table).
 * @returns {Object|null}
 */
export function getProfile() {
  return currentProfile;
}

/**
 * Check if user is logged in.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Check if user is admin.
 * @returns {boolean}
 */
export function isAdmin() {
  return currentProfile?.role === 'admin';
}

/**
 * Check if user is banned.
 * @returns {boolean}
 */
export function isBanned() {
  return currentProfile?.is_banned === true;
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback - called whenever auth state changes
 * @returns {Function} unsubscribe function
 */
export function onAuthChange(callback) {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter((cb) => cb !== callback);
  };
}

function notifyListeners() {
  authListeners.forEach((cb) => cb({ user: currentUser, profile: currentProfile }));
}

/** Set auth state directly — test helper. */
export function _setAuthState(user, profile) {
  currentUser = user;
  currentProfile = profile;
  notifyListeners();
}
