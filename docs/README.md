# 🏪 St. Peter's Marketplace

> A fast, offline-capable PWA marketplace for **St. Peter's Hostel, Kotei** (near KNUST, Kumasi, Ghana) where hostel residents buy and sell anything — textbooks, snacks, electronics, clothing, and services.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | St. Peter's Marketplace |
| **Location** | St. Peter's Hostel, Kotei, Kumasi, Ghana (near KNUST) |
| **Target Users** | Hostel residents (~200-500 students) |
| **Platform** | Progressive Web App (PWA) — mobile-first, installable |
| **Budget** | $0/month (all free-tier services) |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Build Tool** | Vite | ^5.x | Fast dev server, bundling, HMR |
| **Language** | Vanilla JavaScript (ES6+) | — | No framework overhead |
| **Styling** | Vanilla CSS | — | Custom properties (variables), no Tailwind |
| **Fonts** | Google Fonts (Outfit + Inter) | — | Typography |
| **Backend** | Supabase | — | Auth, PostgreSQL DB, file storage, real-time |
| **PWA** | Service Worker + Web App Manifest | — | Offline support, installable |
| **Deployment** | Netlify | — | Free hosting, auto-deploy from GitHub |
| **VCS** | GitHub | — | Version control |

### Why This Stack?
- **No server to manage** — Supabase handles everything backend
- **No framework bloat** — Vanilla JS keeps the bundle tiny (<50KB gzipped)
- **PWA-first** — Works on slow networks, installable on phones
- **100% free** — Every service is within free tier limits

### Free Tier Limits

| Service | Limit | Our Expected Usage |
|---------|-------|--------------------|
| Supabase DB | 500MB | ~50MB (text data is tiny) |
| Supabase Storage | 1GB | ~800MB (images + 30s videos) |
| Supabase Auth | 50K MAU | ~500 users |
| Netlify Bandwidth | 100GB/mo | ~10-20GB/mo |
| Netlify Builds | 300 min/mo | ~30 builds/mo |

---

## Branding — Terracotta & Cream

### Color Source
Colors are extracted from the **actual St. Peter's Hostel building** in Kotei:
- The building features bold **terracotta/coral orange** walls
- With **warm cream/off-white** columns and structural accents
- The perimeter wall is **white** with a **terracotta cap**

### Color Palette

```
PRIMARY COLORS (Terracotta/Coral — from the building walls)
├── --color-primary:        #D4553A    (Terracotta — main brand color)
├── --color-primary-light:  #E8745A    (Light coral — hover states)
├── --color-primary-dark:   #B33D25    (Deep terracotta — active/pressed)
├── --color-primary-50:     #FDF2F0    (Faintest terracotta tint — backgrounds)
├── --color-primary-100:    #FADDD7    (Very light — selected states)
└── --color-primary-900:    #6B2114    (Darkest — text on light bg)

SECONDARY COLORS (Cream — from the building columns)
├── --color-secondary:      #E8E0D8    (Warm cream)
├── --color-secondary-light:#F2EDE8    (Light cream — subtle backgrounds)
└── --color-secondary-dark: #C4B8AB    (Darker cream — borders)

ACCENT (Golden highlight for prices and CTAs)
├── --color-accent:         #F59E0B    (Amber/Gold — prices, CTAs)
├── --color-accent-light:   #FCD34D    (Light gold — hover)
└── --color-accent-dark:    #D97706    (Dark gold — active)

NEUTRALS
├── --color-white:          #FFFFFF
├── --color-gray-50:        #F9FAFB
├── --color-gray-100:       #F3F4F6
├── --color-gray-200:       #E5E7EB
├── --color-gray-300:       #D1D5DB
├── --color-gray-400:       #9CA3AF
├── --color-gray-500:       #6B7280
├── --color-gray-600:       #4B5563
├── --color-gray-700:       #374151
├── --color-gray-800:       #1F2937
└── --color-gray-900:       #111827

SEMANTIC
├── --color-success:        #10B981    (Available, confirmed)
├── --color-warning:        #F59E0B    (Pending, attention)
├── --color-danger:         #EF4444    (Sold, error, delete)
└── --color-info:           #3B82F6    (Information, links)
```

### Typography

```
FONTS
├── Headings:  'Outfit', sans-serif    (weight: 600, 700)
├── Body:      'Inter', sans-serif     (weight: 400, 500, 600)
└── Mono:      'JetBrains Mono', monospace (prices, codes)

SCALE (mobile-first, rem-based)
├── --font-xs:    0.75rem   (12px)
├── --font-sm:    0.875rem  (14px)
├── --font-base:  1rem      (16px)
├── --font-lg:    1.125rem  (18px)
├── --font-xl:    1.25rem   (20px)
├── --font-2xl:   1.5rem    (24px)
├── --font-3xl:   1.875rem  (30px)
├── --font-4xl:   2.25rem   (36px)
└── --font-5xl:   3rem      (48px)
```

### Spacing Scale

```
--space-1:   0.25rem   (4px)
--space-2:   0.5rem    (8px)
--space-3:   0.75rem   (12px)
--space-4:   1rem      (16px)
--space-5:   1.25rem   (20px)
--space-6:   1.5rem    (24px)
--space-8:   2rem      (32px)
--space-10:  2.5rem    (40px)
--space-12:  3rem      (48px)
--space-16:  4rem      (64px)
--space-20:  5rem      (80px)
```

### Border Radius

```
--radius-sm:   0.375rem  (6px)
--radius-md:   0.5rem    (8px)
--radius-lg:   0.75rem   (12px)
--radius-xl:   1rem      (16px)
--radius-2xl:  1.5rem    (24px)
--radius-full: 9999px    (pill/circle)
```

### Shadows

```
--shadow-sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
--shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
--shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
```

---

## Folder Structure

```
Peters-Marketplace/
├── docs/                          # Project documentation
│   ├── README.md                  # This file — master overview
│   ├── modules/                   # Module specifications
│   │   ├── MODULE_00_PROJECT_SETUP.md
│   │   ├── MODULE_01_DESIGN_SYSTEM.md
│   │   ├── MODULE_02_AUTHENTICATION.md
│   │   ├── MODULE_03_LANDING_PAGE.md
│   │   ├── MODULE_04_PRODUCT_LISTING.md
│   │   ├── MODULE_05_PRODUCT_DETAIL.md
│   │   ├── MODULE_06_SELLER_DASHBOARD.md
│   │   ├── MODULE_07_ADMIN_PANEL.md
│   │   ├── MODULE_08_PWA_PERFORMANCE.md
│   │   └── MODULE_09_DEPLOYMENT.md
│   └── PROGRESS.md                # Build progress tracker
│
├── index.html                     # Entry point
├── vite.config.js                 # Vite configuration
├── package.json                   # Dependencies
│
├── public/                        # Static assets (copied as-is)
│   ├── manifest.json              # PWA web app manifest
│   ├── sw.js                      # Service worker
│   ├── icons/                     # PWA icons (192x192, 512x512)
│   ├── favicon.ico
│   └── offline.html               # Offline fallback page
│
├── src/                           # Application source code
│   ├── main.js                    # App entry point, router init
│   ├── router.js                  # Client-side SPA router
│   ├── supabase.js                # Supabase client init
│   │
│   ├── styles/                    # CSS
│   │   ├── index.css              # Master CSS file (imports all below)
│   │   ├── variables.css          # CSS custom properties (design tokens)
│   │   ├── reset.css              # CSS reset / normalize
│   │   ├── typography.css         # Font imports, text styles
│   │   ├── components.css         # Reusable component styles
│   │   ├── utilities.css          # Utility classes
│   │   └── animations.css         # Keyframe animations, transitions
│   │
│   ├── components/                # Reusable UI components (JS)
│   │   ├── navbar.js              # Navigation bar
│   │   ├── footer.js              # Footer
│   │   ├── product-card.js        # Product card (grid item)
│   │   ├── image-gallery.js       # Image gallery/carousel
│   │   ├── video-player.js        # Video player (30s cap)
│   │   ├── search-bar.js          # Search input with filters
│   │   ├── category-pills.js      # Category filter pills
│   │   ├── skeleton-loader.js     # Loading skeleton placeholders
│   │   ├── toast.js               # Toast notifications
│   │   ├── modal.js               # Modal dialog
│   │   ├── upload-widget.js       # Image/video upload with preview
│   │   └── auth-guard.js          # Route protection wrapper
│   │
│   ├── pages/                     # Page modules
│   │   ├── home.js                # Landing page
│   │   ├── products.js            # Product listing (browse all)
│   │   ├── product-detail.js      # Single product view
│   │   ├── login.js               # Login page
│   │   ├── signup.js              # Signup page
│   │   ├── dashboard.js           # Seller dashboard
│   │   ├── dashboard-new.js       # Create new listing
│   │   ├── dashboard-edit.js      # Edit listing
│   │   ├── admin.js               # Admin panel
│   │   └── offline.js             # Offline fallback
│   │
│   ├── lib/                       # Utility functions
│   │   ├── auth.js                # Auth state management
│   │   ├── api.js                 # Supabase API wrappers (CRUD)
│   │   ├── storage.js             # File upload/download helpers
│   │   ├── image-utils.js         # Client-side image compression
│   │   ├── video-utils.js         # Video duration validation
│   │   ├── format.js              # Price formatting, date formatting
│   │   └── constants.js           # Categories, conditions, config
│   │
│   └── assets/                    # Bundled assets
│       ├── images/                # Static images (logo, icons, etc.)
│       └── placeholder.svg        # Offline image placeholder
│
└── supabase/                      # Supabase configuration
    ├── schema.sql                 # Database schema (tables, RLS policies)
    └── storage-policies.sql       # Storage bucket policies
```

---

## Database Schema

### Table: `profiles`
Extends Supabase Auth users with marketplace-specific data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, FK → auth.users.id | Same as Supabase auth user ID |
| `email` | `text` | NOT NULL, UNIQUE | User's email |
| `full_name` | `text` | NOT NULL | Display name |
| `phone` | `text` | NOT NULL | Phone number for calls |
| `whatsapp` | `text` | NULL | WhatsApp number (if different) |
| `room_number` | `text` | NOT NULL | Hostel room number |
| `avatar_url` | `text` | NULL | Profile picture URL |
| `role` | `text` | DEFAULT 'seller' | 'seller' or 'admin' |
| `is_banned` | `boolean` | DEFAULT false | Admin can ban sellers |
| `created_at` | `timestamptz` | DEFAULT now() | Account creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last profile update |

### Table: `products`
All marketplace listings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Product ID |
| `seller_id` | `uuid` | FK → profiles.id, NOT NULL | Who is selling |
| `title` | `text` | NOT NULL, max 100 chars | Product title |
| `description` | `text` | NULL, max 1000 chars | Detailed description |
| `price` | `decimal(10,2)` | NOT NULL, >= 0 | Price in GHS (Ghana Cedis) |
| `category` | `text` | NOT NULL | One of the 6 categories |
| `condition` | `text` | NOT NULL | 'new', 'used', 'fairly-used' |
| `status` | `text` | DEFAULT 'available' | 'available' or 'sold' |
| `image_urls` | `text[]` | NOT NULL, min 1 | Array of image URLs (max 5) |
| `thumbnail_urls` | `text[]` | NULL | Compressed thumbnail URLs |
| `video_url` | `text` | NULL | Video URL (optional) |
| `video_duration` | `integer` | NULL, max 30 | Video duration in seconds |
| `views_count` | `integer` | DEFAULT 0 | View counter |
| `is_flagged` | `boolean` | DEFAULT false | Admin flagged for review |
| `created_at` | `timestamptz` | DEFAULT now() | Listing creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last edit time |

### Table: `favorites`
Users can save products to favorites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Favorite ID |
| `user_id` | `uuid` | FK → profiles.id, NOT NULL | Who favorited |
| `product_id` | `uuid` | FK → products.id, NOT NULL | What was favorited |
| `created_at` | `timestamptz` | DEFAULT now() | When favorited |

**Unique constraint**: `(user_id, product_id)` — one favorite per user per product.

### Row Level Security (RLS) Policies

```
PROFILES:
  - SELECT: Anyone can view profiles (public)
  - INSERT: Users can create their own profile (auth.uid() = id)
  - UPDATE: Users can update their own profile (auth.uid() = id)
  - DELETE: Not allowed (deactivate instead)

PRODUCTS:
  - SELECT: Anyone can view non-flagged products (public)
  - INSERT: Authenticated non-banned users only
  - UPDATE: Seller can update own products (seller_id = auth.uid())
  - DELETE: Seller can delete own products OR admin can delete any
  - ADMIN: Can update any product (for flagging, moderation)

FAVORITES:
  - SELECT: Users can view their own favorites (user_id = auth.uid())
  - INSERT: Authenticated users only (user_id = auth.uid())
  - DELETE: Users can remove their own favorites (user_id = auth.uid())
```

### Storage Buckets

```
PRODUCT-IMAGES:
  - Max file size: 5MB per image
  - Allowed types: image/jpeg, image/png, image/webp
  - Public read access
  - Write: authenticated users only
  - Path format: {user_id}/{product_id}/{filename}

PRODUCT-VIDEOS:
  - Max file size: 10MB per video
  - Allowed types: video/mp4
  - Max duration: 30 seconds (validated client-side)
  - Public read access
  - Write: authenticated users only
  - Path format: {user_id}/{product_id}/{filename}

AVATARS:
  - Max file size: 2MB
  - Allowed types: image/jpeg, image/png, image/webp
  - Public read access
  - Write: authenticated users (own folder only)
  - Path format: {user_id}/avatar.{ext}
```

---

## Page Routes

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Home | No | Landing page with hero, featured products, categories |
| `/products` | Product Listing | No | Browse all listings with search & filters |
| `/products/:id` | Product Detail | No | Full product view with gallery, video, seller info |
| `/category/:name` | Category View | No | Filtered products by category |
| `/auth/login` | Login | No (redirect if logged in) | Email + password login |
| `/auth/signup` | Signup | No (redirect if logged in) | Registration with room number |
| `/dashboard` | Seller Dashboard | Yes (seller) | My listings, stats |
| `/dashboard/new` | New Listing | Yes (seller) | Create a product listing |
| `/dashboard/edit/:id` | Edit Listing | Yes (owner only) | Edit an existing listing |
| `/admin` | Admin Panel | Yes (admin only) | Moderation, user management, analytics |

---

## Categories

| Category | Icon (Emoji) | Description |
|----------|-------------|-------------|
| Food & Snacks | 🍕 | Cooked food, snacks, drinks, raw ingredients |
| Electronics | 📱 | Phones, laptops, chargers, headphones, gadgets |
| Books | 📚 | Textbooks, novels, notes, past questions |
| Clothing | 👕 | Clothes, shoes, accessories, jerseys |
| Services | ✂️ | Haircuts, tutoring, laundry, printing, repairs |
| Others | 📦 | Furniture, kitchenware, anything else |

---

## Product Conditions

| Condition | Badge Color | Description |
|-----------|-------------|-------------|
| New | `--color-success` (#10B981) | Brand new, unused, sealed |
| Fairly Used | `--color-accent` (#F59E0B) | Used but in good condition |
| Used | `--color-gray-500` (#6B7280) | Noticeably worn, functional |

---

## Module Build Order

Modules should be built in this exact order, as each depends on the previous:

| # | Module | Depends On | Estimated Effort |
|---|--------|------------|------------------|
| 0 | [Project Setup](modules/MODULE_00_PROJECT_SETUP.md) | — | 30 min |
| 1 | [Design System](modules/MODULE_01_DESIGN_SYSTEM.md) | Module 0 | 1-2 hrs |
| 2 | [Authentication](modules/MODULE_02_AUTHENTICATION.md) | Modules 0, 1 | 1-2 hrs |
| 3 | [Landing Page](modules/MODULE_03_LANDING_PAGE.md) | Modules 0, 1 | 1-2 hrs |
| 4 | [Product Listing](modules/MODULE_04_PRODUCT_LISTING.md) | Modules 0, 1, 2 | 2-3 hrs |
| 5 | [Product Detail](modules/MODULE_05_PRODUCT_DETAIL.md) | Modules 0, 1, 4 | 1-2 hrs |
| 6 | [Seller Dashboard](modules/MODULE_06_SELLER_DASHBOARD.md) | Modules 0, 1, 2 | 2-3 hrs |
| 7 | [Admin Panel](modules/MODULE_07_ADMIN_PANEL.md) | Modules 0, 1, 2 | 2-3 hrs |
| 8 | [PWA & Performance](modules/MODULE_08_PWA_PERFORMANCE.md) | All above | 1-2 hrs |
| 9 | [Deployment](modules/MODULE_09_DEPLOYMENT.md) | All above | 30 min |

---

## Currency

All prices are in **GHS (Ghana Cedis)**. Format: `GH₵ 25.00`

---

## Contact Methods

Each product listing shows two contact buttons:
1. **WhatsApp** — Opens `https://wa.me/{whatsapp_number}?text=Hi, I'm interested in {product_title} on St. Peter's Marketplace`
2. **Phone Call** — Opens `tel:{phone_number}`

The seller provides both numbers during registration.
