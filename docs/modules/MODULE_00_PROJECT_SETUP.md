# Module 00 — Project Setup

> **Status**: ✅ Complete  
> **Depends on**: Nothing  
> **Estimated effort**: 30 minutes  

---

## Objective

Initialize the Vite project, install dependencies, configure the build tool, and establish the folder structure. After this module, you should be able to run `npm run dev` and see a blank page with the correct HTML shell.

---

## Step-by-Step Instructions

### Step 1: Initialize Vite Project

Run in the `Peters-Marketplace` directory:

```bash
npm create vite@latest ./ -- --template vanilla
```

If it asks to overwrite, say yes (only `package.json` and boilerplate will be created).

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install -D vite-plugin-pwa
```

**Dependencies explained:**
| Package | Purpose | Size |
|---------|---------|------|
| `@supabase/supabase-js` | Supabase client SDK (auth, DB, storage) | ~40KB gzipped |
| `vite-plugin-pwa` | Auto-generates service worker & manifest | Dev only |

### Step 3: Create Folder Structure

Create ALL of these directories (empty files will be populated in later modules):

```
src/
├── main.js
├── router.js
├── supabase.js
├── styles/
│   ├── index.css
│   ├── variables.css
│   ├── reset.css
│   ├── typography.css
│   ├── components.css
│   ├── utilities.css
│   └── animations.css
├── components/
├── pages/
├── lib/
│   └── constants.js
└── assets/
    └── images/

public/
├── icons/
└── offline.html
```

### Step 4: Configure `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: "St. Peter's Marketplace",
        short_name: "SP Market",
        description: "Buy & sell anything at St. Peter's Hostel, Kotei",
        theme_color: '#D4553A',
        background_color: '#F9FAFB',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // Cache Supabase storage images
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'product-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              }
            }
          },
          {
            // Cache Supabase API responses
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

### Step 5: Set Up `index.html`

Replace the default `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO -->
  <title>St. Peter's Marketplace — Buy & Sell at Kotei</title>
  <meta name="description" content="The marketplace for St. Peter's Hostel residents. Buy and sell textbooks, electronics, food, clothing, and services." />
  <meta name="keywords" content="St Peters Hostel, Kotei, KNUST, marketplace, buy, sell, students" />
  
  <!-- PWA -->
  <meta name="theme-color" content="#D4553A" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  
  <!-- Fonts (preconnect for speed) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
</head>
<body>
  <!-- App Shell -->
  <div id="app">
    <nav id="navbar"></nav>
    <main id="page-content"></main>
    <footer id="footer"></footer>
  </div>
  
  <!-- Toast container for notifications -->
  <div id="toast-container" aria-live="polite"></div>
  
  <!-- Modal container -->
  <div id="modal-container"></div>
  
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Step 6: Create Supabase Client (`src/supabase.js`)

```javascript
import { createClient } from '@supabase/supabase-js';

// These will be set after creating the Supabase project
// IMPORTANT: These are PUBLIC keys — safe to expose in client code
const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // e.g., https://abc123.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Public anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**To get these keys:**
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (name: "peters-marketplace")
3. Go to Project Settings → API
4. Copy the "Project URL" and "anon/public" key

### Step 7: Create Constants (`src/lib/constants.js`)

```javascript
// Product categories
export const CATEGORIES = [
  { id: 'food-snacks', name: 'Food & Snacks', emoji: '🍕' },
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'clothing', name: 'Clothing', emoji: '👕' },
  { id: 'services', name: 'Services', emoji: '✂️' },
  { id: 'others', name: 'Others', emoji: '📦' },
];

// Product conditions
export const CONDITIONS = [
  { id: 'new', name: 'New', color: 'var(--color-success)' },
  { id: 'fairly-used', name: 'Fairly Used', color: 'var(--color-accent)' },
  { id: 'used', name: 'Used', color: 'var(--color-gray-500)' },
];

// Upload limits
export const UPLOAD_LIMITS = {
  MAX_IMAGES: 5,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_VIDEO_SIZE_MB: 10,
  MAX_VIDEO_DURATION_SECONDS: 30,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4'],
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_QUALITY: 0.7,
};

// Currency
export const CURRENCY = {
  code: 'GHS',
  symbol: 'GH₵',
  locale: 'en-GH',
};

// Sort options
export const SORT_OPTIONS = [
  { id: 'newest', name: 'Newest First', column: 'created_at', ascending: false },
  { id: 'oldest', name: 'Oldest First', column: 'created_at', ascending: true },
  { id: 'price-low', name: 'Price: Low to High', column: 'price', ascending: true },
  { id: 'price-high', name: 'Price: High to Low', column: 'price', ascending: false },
  { id: 'popular', name: 'Most Viewed', column: 'views_count', ascending: false },
];
```

### Step 8: Create Entry Point (`src/main.js`)

```javascript
// Import styles
import './styles/index.css';

// App initialization
async function initApp() {
  console.log("🏪 St. Peter's Marketplace is starting...");
  
  // Router and components will be initialized here in later modules
  // For now, just render a placeholder
  const app = document.getElementById('page-content');
  app.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Outfit', sans-serif;">
      <h1 style="color: #D4553A;">🏪 St. Peter's Marketplace</h1>
    </div>
  `;
}

// Start the app
initApp();
```

---

## Verification Checklist

After completing this module, verify:

- [ ] `npm run dev` starts the Vite dev server on port 3000
- [ ] Browser shows "🏪 St. Peter's Marketplace" heading in terracotta color
- [ ] No console errors
- [ ] All folders exist in the structure above
- [ ] `supabase.js` is created (keys can be placeholder for now)
- [ ] `constants.js` has all categories, conditions, and limits
- [ ] `vite.config.js` has PWA plugin configured

---

## Files Created in This Module

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (auto-generated by Vite) |
| `vite.config.js` | Vite + PWA configuration |
| `index.html` | HTML shell with SEO, fonts, app structure |
| `src/main.js` | App entry point |
| `src/supabase.js` | Supabase client initialization |
| `src/lib/constants.js` | App-wide constants |
| All empty CSS files in `src/styles/` | Will be populated in Module 01 |

---

## Next Module

→ [Module 01: Design System](MODULE_01_DESIGN_SYSTEM.md)
