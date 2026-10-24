# St. Peter's Marketplace

A fast, offline-capable PWA marketplace for **St. Peter's Hostel, Kotei** (near KNUST, Kumasi, Ghana), where residents buy and sell textbooks, snacks, electronics, clothing and services.

Built with Vite + vanilla JavaScript + Supabase. No framework, no CSS library — the whole app ships in about 24KB of gzipped JavaScript plus the Supabase client.

---

## Getting started

```bash
npm install
npm run dev          # dev server on http://localhost:3000
```

The app runs immediately, but **every data fetch fails until Supabase is configured** — see below.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest unit + DOM suite |
| `npm run test:watch` | Vitest in watch mode |
| `npm run smoke` | Drive the built app in a real browser (needs `npm run preview` running) |
| `npm run icons` | Regenerate the PWA icons and favicon |

---

## Connecting Supabase

The app ships with placeholder credentials and shows a banner saying so. To connect a real backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **Settings → API** and copy the **Project URL** and **anon public** key.
3. Paste both into `src/supabase.js`:
   ```js
   const SUPABASE_URL = 'https://yourproject.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGci...';
   ```
   These are public keys — they are safe in client code, and row-level security is what protects the data.
4. In the **SQL Editor**, run `supabase/schema.sql` (tables, indexes, RLS policies, signup trigger).
5. Under **Storage**, create three **public** buckets: `product-images`, `product-videos`, `avatars`.
6. Back in the SQL Editor, run `supabase/storage-policies.sql`.
7. Under **Authentication → Settings**, enable email sign-in and set the site URL. Turn off "Confirm email" while testing.

### Making yourself an admin

Sign up through the app first, then run in the SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

Log out and back in, and the Admin link appears in the navbar.

---

## Project structure

```
src/
├── main.js                 App init and route registration
├── router.js               Hash-based SPA router with auth guards
├── supabase.js             Supabase client (paste your keys here)
├── styles/                 Design tokens, reset, components, pages
├── components/             Navbar, footer, cards, gallery, upload, modal, icons
├── pages/                  One module per screen
└── lib/                    auth, api, storage, validation, formatting, media utils

supabase/
├── schema.sql              Tables, RLS policies, triggers
└── storage-policies.sql    Bucket access rules

tests/                      Vitest unit + DOM tests
scripts/                    Icon generator, browser smoke test
docs/                       Module specifications this app was built from
```

---

## What is built

Modules 0 through 7 of `docs/modules/` are implemented:

| # | Module | Status |
|---|--------|--------|
| 0 | Project Setup | Done |
| 1 | Design System | Done |
| 2 | Authentication | Done |
| 3 | Landing Page | Done |
| 4 | Product Listing & Search | Done |
| 5 | Product Detail | Done |
| 6 | Seller Dashboard | Done |
| 7 | Admin Panel | Done |
| 8 | PWA & Performance | Partial — the PWA plugin, manifest, service worker, icons and offline page are in place; the module's remaining audit work is not |
| 9 | Deployment | Not started |

---

## Design notes

**Colours** come from the actual hostel building in Kotei: terracotta walls (`#D4553A`) and warm cream columns (`#E8E0D8`), with amber for prices and calls to action. Every value is a CSS custom property in `src/styles/variables.css` — nothing is hardcoded in a component.

**Icons are inline SVG, never emoji.** Emoji render differently on every platform, cannot be recoloured, and sit inconsistently on the baseline. `src/components/icons.js` exports an `icon(name, options)` helper whose SVGs inherit `currentColor`, so an icon always matches the text or button around it. Decorative icons are `aria-hidden`; meaningful ones take a `title`.

**Mobile first.** Students browse on phones over patchy data, so images are compressed to WebP client-side before upload (a 3MB photo typically lands under 200KB), thumbnails are generated at 300px for grid cards, images lazy-load with a blur-up, videos use `preload="none"`, and listings page 12 at a time.

---

## Testing

```bash
npm test
```

179 tests across six files cover routing and URL parsing, auth state and error mapping, price/date/phone formatting, form and upload validation, Supabase query building, and DOM rendering for cards, galleries, modals, toasts and the admin filters.

For a real-browser pass:

```bash
npm run preview      # in one terminal
npm run smoke        # in another
```

This loads every route in headless Chromium, checks for console errors, exercises search, filters, form validation and the mobile menu, asserts no emoji reach the rendered UI, and writes screenshots to `.smoke/`.

---

## Known limitations

- **Favourites** are in the schema (`favorites` table with RLS) but no UI uses them yet; the product card's heart button is opt-in and inert.
- **Avatar upload** has a storage bucket and policies, but no profile screen to use it — avatars fall back to initials.
- Modules 8 and 9 (performance audit, deployment) are not complete.
