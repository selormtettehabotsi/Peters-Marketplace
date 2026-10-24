# Module 02 — Authentication

> **Status**: ✅ Complete  
> **Depends on**: Module 00 (Project Setup), Module 01 (Design System)  
> **Estimated effort**: 1-2 hours  

---

## Objective

Implement user authentication using Supabase Auth. This includes signup (with email, password, full name, phone, WhatsApp, and room number), login, logout, session persistence, auth state management, and route protection. After this module, users can create accounts and log in.

---

## Supabase Setup (One-Time)

Before coding, you must configure Supabase:

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → Sign up / Log in
2. Click "New Project"
3. Name: `peters-marketplace`
4. Database Password: (save this somewhere safe)
5. Region: Choose closest to Ghana (EU West or similar)
6. Click "Create new project"

### 2. Get API Keys
1. Go to **Settings → API**
2. Copy **Project URL** → paste into `src/supabase.js` as `SUPABASE_URL`
3. Copy **anon public** key → paste into `src/supabase.js` as `SUPABASE_ANON_KEY`

### 3. Create Database Tables
Go to **SQL Editor** and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with marketplace data
-- ================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  room_number TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- PRODUCTS TABLE
-- ================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL CHECK (category IN ('food-snacks', 'electronics', 'books', 'clothing', 'services', 'others')),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'fairly-used', 'used')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  image_urls TEXT[] NOT NULL CHECK (array_length(image_urls, 1) >= 1 AND array_length(image_urls, 1) <= 5),
  thumbnail_urls TEXT[],
  video_url TEXT,
  video_duration INTEGER CHECK (video_duration IS NULL OR video_duration <= 30),
  views_count INTEGER NOT NULL DEFAULT 0,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- FAVORITES TABLE
-- ================================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ================================================
-- INDEXES (for query performance)
-- ================================================
CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- PRODUCTS policies
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated non-banned users can create products" 
  ON public.products FOR INSERT 
  WITH CHECK (
    auth.uid() = seller_id 
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true
    )
  );

CREATE POLICY "Sellers can update their own products" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own products" 
  ON public.products FOR DELETE 
  USING (auth.uid() = seller_id);

-- Admin override policies
CREATE POLICY "Admins can update any product" 
  ON public.products FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any product" 
  ON public.products FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FAVORITES policies
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can add favorites" 
  ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites" 
  ON public.favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- ================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, whatsapp, room_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'room_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- AUTO-UPDATE updated_at TIMESTAMP
-- ================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 4. Create Storage Buckets
Go to **Storage** in Supabase dashboard:

1. Create bucket `product-images` → **Public** bucket
2. Create bucket `product-videos` → **Public** bucket
3. Create bucket `avatars` → **Public** bucket

Then run this SQL to set storage policies:

```sql
-- Product images: anyone can view, authenticated can upload
CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Product videos: same as images
CREATE POLICY "Product videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-videos');

CREATE POLICY "Authenticated users can upload product videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own product videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars
CREATE POLICY "Avatars are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. Configure Auth Settings
Go to **Authentication → Settings**:
- Enable "Email" sign-in
- Disable "Confirm email" for now (to simplify testing — enable later in production)
- Set site URL to `http://localhost:3000` (update to production URL later)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/auth.js` | Auth state management (login, signup, logout, session) |
| `src/pages/login.js` | Login page UI |
| `src/pages/signup.js` | Signup page UI |
| `src/components/auth-guard.js` | Route protection (redirect if not logged in) |
| `src/router.js` | Client-side SPA router |

---

## Implementation Details

### `src/lib/auth.js` — Auth State Manager

This file manages the entire authentication lifecycle:

```javascript
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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await fetchProfile(session.user.id);
  }

  // Listen for auth changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
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
 * Sign up a new user.
 * @param {Object} params - { email, password, fullName, phone, whatsapp, roomNumber }
 * @returns {Object} - { user, error }
 */
export async function signUp({ email, password, fullName, phone, whatsapp, roomNumber }) {
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

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Object} - { user, error }
 */
export async function logIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user, error: null };
}

/**
 * Log out the current user.
 */
export async function logOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
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
    authListeners = authListeners.filter(cb => cb !== callback);
  };
}

function notifyListeners() {
  authListeners.forEach(cb => cb({ user: currentUser, profile: currentProfile }));
}
```

### `src/router.js` — Client-Side SPA Router

```javascript
/**
 * Simple hash-based SPA router.
 * Routes are defined as { path, handler, requiresAuth, requiresAdmin }
 */

const routes = [];
let notFoundHandler = null;

/**
 * Register a route.
 * @param {string} path - URL path pattern (e.g., '/products/:id')
 * @param {Function} handler - async function(params) that returns HTML or renders to #page-content
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
 * Navigate to a new route.
 * @param {string} path - e.g., '/products/abc-123'
 */
export function navigate(path) {
  window.location.hash = '#' + path;
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
 * Get current path from hash.
 */
function getCurrentPath() {
  const hash = window.location.hash.slice(1); // Remove '#'
  return hash || '/';
}

/**
 * Match current URL to a route and execute its handler.
 */
async function handleRoute() {
  const path = getCurrentPath();
  
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      // Extract params
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      // Auth check
      if (route.requiresAuth) {
        const { isLoggedIn } = await import('./lib/auth.js');
        if (!isLoggedIn()) {
          navigate('/auth/login');
          return;
        }
      }

      // Admin check
      if (route.requiresAdmin) {
        const { isAdmin } = await import('./lib/auth.js');
        if (!isAdmin()) {
          navigate('/');
          return;
        }
      }

      // Execute handler
      const content = document.getElementById('page-content');
      try {
        await route.handler(params, content);
      } catch (error) {
        console.error('Route handler error:', error);
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Something went wrong</div></div>`;
      }
      
      // Scroll to top on navigation
      window.scrollTo(0, 0);
      return;
    }
  }

  // No route matched — 404
  if (notFoundHandler) {
    const content = document.getElementById('page-content');
    notFoundHandler({}, content);
  }
}

/**
 * Convert a path pattern like '/products/:id' to a regex.
 */
function pathToRegex(path) {
  const pattern = path
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, '([^/]+)');
  return new RegExp('^' + pattern + '$');
}

/**
 * Extract parameter names from a path pattern.
 */
function extractParamNames(path) {
  const names = [];
  const regex = /:(\w+)/g;
  let match;
  while ((match = regex.exec(path)) !== null) {
    names.push(match[1]);
  }
  return names;
}
```

### `src/pages/login.js` — Login Page

This page should render:
1. A centered card on a `--color-primary-50` background
2. The marketplace logo/title at the top
3. Email input field
4. Password input field
5. "Log In" primary button (full width)
6. "Don't have an account? Sign up" link at the bottom
7. Loading spinner on the button while submitting
8. Error toast if login fails

**Form validation:**
- Email: required, must be valid email format
- Password: required, minimum 6 characters
- Show inline error messages below invalid fields

**On successful login:** Navigate to `/dashboard`

**HTML structure:**
```html
<section class="auth-page">
  <div class="auth-card card">
    <div class="card-body">
      <div class="auth-header">
        <h1>🏪</h1>
        <h2>Welcome Back</h2>
        <p class="text-muted">Log in to St. Peter's Marketplace</p>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input class="form-input" type="email" id="login-email" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password" placeholder="••••••••" required minlength="6" />
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit">
          Log In
        </button>
      </form>
      <p class="auth-footer">
        Don't have an account? <a href="#/auth/signup" class="text-primary font-semibold">Sign Up</a>
      </p>
    </div>
  </div>
</section>
```

**CSS for auth pages** (add to `components.css` or a new `auth.css`):
```css
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--navbar-height));
  padding: var(--space-4);
  background-color: var(--color-primary-50);
}

.auth-card {
  width: 100%;
  max-width: 420px;
}

.auth-card .card-body {
  padding: var(--space-8);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.auth-header h1 {
  font-size: 3rem;
  margin-bottom: var(--space-2);
}

.auth-header h2 {
  margin-bottom: var(--space-2);
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  font-size: var(--font-sm);
  color: var(--color-gray-500);
}
```

### `src/pages/signup.js` — Signup Page

This page should render:
1. Same centered card layout as login
2. Title: "Join the Marketplace"
3. Fields:
   - **Full Name** — text input, required
   - **Email** — email input, required
   - **Phone Number** — tel input, required, placeholder: "0XX XXX XXXX"
   - **WhatsApp Number** — tel input, optional, placeholder: "Same as phone if left empty"
   - **Room Number** — text input, required, placeholder: "e.g. B204"
   - **Password** — password input, required, min 6 chars
   - **Confirm Password** — password input, must match password
4. "Create Account" primary button
5. "Already have an account? Log in" link

**Form validation:**
- All required fields must be filled
- Email must be valid
- Phone must be at least 10 digits
- Password minimum 6 characters
- Confirm password must match password
- Show inline errors

**On successful signup:** Navigate to `/dashboard` with a success toast "Account created! Start selling 🎉"

### `src/components/auth-guard.js` — Route Protection

```javascript
import { isLoggedIn, isAdmin } from '../lib/auth.js';
import { navigate } from '../router.js';

/**
 * Protects a page handler — redirects to login if not authenticated.
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
```

---

## Verification Checklist

After completing this module, verify:

- [ ] Supabase project is created with correct tables and RLS policies
- [ ] Storage buckets are created (product-images, product-videos, avatars)
- [ ] `src/supabase.js` has real Supabase URL and anon key
- [ ] Signup page renders with all fields (name, email, phone, WhatsApp, room, password)
- [ ] Signup creates a user in Supabase Auth AND a row in profiles table
- [ ] Login page renders with email and password fields
- [ ] Login with correct credentials works and redirects to dashboard
- [ ] Login with wrong credentials shows an error message
- [ ] Logout clears the session
- [ ] Refreshing the page preserves the login session
- [ ] Protected routes redirect to login when not authenticated
- [ ] Router navigates between pages without full page reload

---

## Edge Cases to Handle

1. **Duplicate email**: Show "An account with this email already exists"
2. **Network error**: Show "Network error. Please check your connection"
3. **Banned user**: After login, check `is_banned` — if true, show "Your account has been suspended" and log out
4. **Empty WhatsApp**: Default to phone number

---

## Next Module

→ [Module 03: Landing Page](MODULE_03_LANDING_PAGE.md)
