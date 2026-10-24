# Module 03 — Landing Page

> **Status**: ✅ Complete  
> **Depends on**: Module 00 (Project Setup), Module 01 (Design System)  
> **Estimated effort**: 1-2 hours  

---

## Objective

Build the main landing page — the first thing users see. It must be visually stunning, load fast, and clearly communicate what the marketplace is. It should feature a hero section, category navigation, featured/recent products, and a footer. This page drives users to browse products or sign up.

---

## Page Structure

The landing page consists of these sections, in order from top to bottom:

```
┌──────────────────────────────────────────┐
│               NAVBAR                      │
├──────────────────────────────────────────┤
│               HERO SECTION                │
│  "Buy & Sell at St. Peter's Hostel"       │
│  [Browse Products]  [Start Selling]       │
├──────────────────────────────────────────┤
│            CATEGORIES BAR                 │
│  🍕 Food  📱 Electronics  📚 Books  ...   │
├──────────────────────────────────────────┤
│          FEATURED PRODUCTS                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ Card │  │ Card │  │ Card │  │ Card │ │
│  └──────┘  └──────┘  └──────┘  └──────┘ │
├──────────────────────────────────────────┤
│           HOW IT WORKS                    │
│  1. Sign Up  →  2. List  →  3. Sell      │
├──────────────────────────────────────────┤
│              FOOTER                       │
└──────────────────────────────────────────┘
```

---

## Components to Build

### 1. Navbar (`src/components/navbar.js`)

The navbar is shared across ALL pages. It must be:
- **Sticky** at the top (`position: sticky; top: 0;`)
- **Glass effect** background (`backdrop-filter: blur(12px)`)
- **Height**: `var(--navbar-height)` (64px)

**Contents:**
| Element | Left-aligned | Right-aligned |
|---------|-------------|---------------|
| Logo | "🏪 SP Market" (text logo, link to `/`) | — |
| Search | Search input (desktop only, hidden on mobile) | — |
| Nav Links | — | Browse, Dashboard (if logged in), Login/Signup (if not) |
| Avatar | — | User avatar dropdown (if logged in) |
| Mobile Menu | — | Hamburger icon (mobile only) |

**Navbar HTML structure:**
```html
<nav class="navbar" id="navbar">
  <div class="container flex items-center justify-between">
    <!-- Logo -->
    <a href="#/" class="navbar-logo">
      <span class="logo-icon">🏪</span>
      <span class="logo-text">SP Market</span>
    </a>

    <!-- Search bar (desktop) -->
    <div class="search-bar hide-mobile">
      <span class="search-icon">🔍</span>
      <input type="text" class="form-input" placeholder="Search products..." id="nav-search" />
    </div>

    <!-- Nav actions -->
    <div class="navbar-actions flex items-center gap-3">
      <a href="#/products" class="btn btn-ghost btn-sm hide-mobile">Browse</a>
      
      <!-- Show if logged in -->
      <a href="#/dashboard" class="btn btn-ghost btn-sm hide-mobile" id="nav-dashboard">Dashboard</a>
      
      <!-- Show if NOT logged in -->
      <a href="#/auth/login" class="btn btn-secondary btn-sm" id="nav-login">Log In</a>
      <a href="#/auth/signup" class="btn btn-primary btn-sm" id="nav-signup">Sign Up</a>
      
      <!-- Show if logged in — avatar with dropdown -->
      <div class="avatar-dropdown hidden" id="nav-avatar-menu">
        <button class="avatar avatar-sm avatar-placeholder" id="nav-avatar-btn">P</button>
        <!-- Dropdown menu appears on click -->
      </div>

      <!-- Mobile menu toggle -->
      <button class="btn btn-icon hide-desktop" id="mobile-menu-toggle">☰</button>
    </div>
  </div>
</nav>
```

**Navbar CSS:**
```css
.navbar {
  position: sticky;
  top: 0;
  height: var(--navbar-height);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-gray-200);
  z-index: var(--z-navbar);
  display: flex;
  align-items: center;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-xl);
  color: var(--color-primary);
  text-decoration: none;
}

.logo-icon {
  font-size: 1.5rem;
}
```

**Behavior:**
- The navbar export function `renderNavbar()` should be called on every route change
- It should check auth state and show/hide login vs avatar accordingly
- On mobile, the hamburger opens a slide-down menu
- Search input navigates to `/products?q={searchTerm}` on Enter

### 2. Hero Section

A full-width, visually striking section with:
- **Background**: Gradient using terracotta colors (`--color-primary` → `--color-primary-dark`)
- **White text** on the gradient
- **Heading**: "Buy & Sell at St. Peter's Hostel"
- **Subheading**: "The marketplace for everything in Kotei. From textbooks to snacks — find it here."
- **Two CTA buttons**: 
  - "Browse Products" → `btn-accent` → navigates to `/products`
  - "Start Selling" → `btn-secondary` with white border → navigates to `/auth/signup`
- **Stats bar** below CTAs: "50+ Products · 30+ Sellers · 6 Categories" (fetch real counts from Supabase or hardcode initially)

**Hero CSS:**
```css
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: var(--space-16) 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

/* Decorative background pattern */
.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.hero h1 {
  font-size: var(--font-5xl);
  color: var(--color-white);
  margin-bottom: var(--space-4);
  animation: slideUp 0.6s ease-out;
}

.hero .hero-subtitle {
  font-size: var(--font-lg);
  opacity: 0.9;
  max-width: 500px;
  margin: 0 auto var(--space-8);
  animation: slideUp 0.6s ease-out 0.1s both;
}

.hero-cta {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
  animation: slideUp 0.6s ease-out 0.2s both;
}

.hero-stats {
  display: flex;
  gap: var(--space-8);
  justify-content: center;
  margin-top: var(--space-10);
  opacity: 0.85;
  font-size: var(--font-sm);
  animation: fadeIn 0.6s ease-out 0.4s both;
}

@media (max-width: 768px) {
  .hero h1 { font-size: var(--font-3xl); }
  .hero { padding: var(--space-10) 0; }
  .hero-stats { flex-direction: column; gap: var(--space-2); }
}
```

### 3. Categories Section

A horizontal scrollable row of category pills that link to filtered product views:

```html
<section class="section-sm" id="categories-section">
  <div class="container">
    <h2 class="mb-6">Browse Categories</h2>
    <div class="pill-group" id="category-pills">
      <!-- Generated from CATEGORIES constant -->
      <a href="#/products?category=food-snacks" class="pill">🍕 Food & Snacks</a>
      <a href="#/products?category=electronics" class="pill">📱 Electronics</a>
      <a href="#/products?category=books" class="pill">📚 Books</a>
      <a href="#/products?category=clothing" class="pill">👕 Clothing</a>
      <a href="#/products?category=services" class="pill">✂️ Services</a>
      <a href="#/products?category=others" class="pill">📦 Others</a>
    </div>
  </div>
</section>
```

### 4. Featured Products Section

Display the 8 most recent "available" products in a responsive grid:

```html
<section class="section" id="featured-section">
  <div class="container">
    <div class="flex items-center justify-between mb-6">
      <h2>Latest Listings</h2>
      <a href="#/products" class="btn btn-ghost btn-sm">View All →</a>
    </div>
    <div class="product-grid stagger-children" id="featured-grid">
      <!-- Product cards rendered here -->
      <!-- Show skeleton loaders while fetching -->
    </div>
  </div>
</section>
```

**Data fetching:**
```javascript
// Fetch 8 latest available products
const { data: products } = await supabase
  .from('products')
  .select('*, profiles!seller_id(full_name, avatar_url)')
  .eq('status', 'available')
  .eq('is_flagged', false)
  .order('created_at', { ascending: false })
  .limit(8);
```

**Product card rendering** — use the `product-card.js` component (see below).

### 5. How It Works Section

Three steps with icons, shown in a horizontal row:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   📝        │  │   📸        │  │   🤝        │
│ Sign Up     │  │ List Item   │  │ Sell!       │
│ Create your │  │ Add photos  │  │ Buyers      │
│ account in  │  │ and details │  │ contact you │
│ 30 seconds  │  │ of your item│  │ via WhatsApp│
└─────────────┘  └─────────────┘  └─────────────┘
```

**CSS for steps:**
```css
.how-it-works {
  background-color: var(--color-secondary-light);
  padding: var(--space-16) 0;
  text-align: center;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-8);
  max-width: 800px;
  margin: var(--space-10) auto 0;
}

.step-card {
  padding: var(--space-6);
}

.step-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: var(--color-white);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-sm);
  margin-bottom: var(--space-3);
}
```

### 6. Footer (`src/components/footer.js`)

Shared across all pages. Contains:
- "St. Peter's Marketplace" branding
- "Made for St. Peter's Hostel, Kotei"
- Quick links: Browse, Sell, Login
- Contact/social links (optional)
- © 2026 copyright

**Footer CSS:**
```css
.footer {
  background-color: var(--color-gray-900);
  color: var(--color-gray-400);
  padding: var(--space-12) 0 var(--space-6);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.footer-brand {
  font-family: var(--font-heading);
  font-size: var(--font-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
  margin-bottom: var(--space-3);
}

.footer a:hover {
  color: var(--color-primary-light);
}

.footer-bottom {
  border-top: 1px solid var(--color-gray-800);
  padding-top: var(--space-6);
  text-align: center;
  font-size: var(--font-sm);
}

@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr; }
}
```

### 7. Product Card Component (`src/components/product-card.js`)

Reusable card used in grids everywhere. Renders a single product.

**Input:** A product object from Supabase.

**Renders:**
```html
<article class="card product-card" data-product-id="{id}">
  <!-- Image with lazy loading -->
  <div class="card-image-wrapper">
    <img 
      src="{thumbnail_urls[0] || image_urls[0]}" 
      alt="{title}" 
      class="card-image blur-up" 
      loading="lazy"
      onload="this.classList.add('loaded')"
    />
    <!-- Condition badge (top-left) -->
    <span class="badge badge-{conditionColor} product-status">{condition}</span>
    <!-- Favorite button (top-right) — only if logged in -->
    <button class="btn btn-icon product-favorite" aria-label="Add to favorites">♡</button>
  </div>
  
  <div class="card-body">
    <h3 class="product-title truncate">{title}</h3>
    <p class="product-price">GH₵ {price}</p>
    <div class="product-meta">
      <img src="{seller.avatar_url}" class="avatar avatar-sm" />
      <span>{seller.full_name}</span>
      <span>·</span>
      <span>{timeAgo(created_at)}</span>
    </div>
  </div>
</article>
```

**Export a function:**
```javascript
/**
 * Create a product card DOM element.
 * @param {Object} product - Product data from Supabase (with joined seller profile)
 * @returns {HTMLElement} - The card element
 */
export function createProductCard(product) {
  // ... build and return the card element
  // Add click listener to navigate to /products/:id
}
```

**Skeleton loader variant:**
```javascript
/**
 * Create a skeleton placeholder card (for loading states).
 * @returns {HTMLElement}
 */
export function createSkeletonCard() {
  const card = document.createElement('article');
  card.className = 'card product-card';
  card.innerHTML = `
    <div class="skeleton skeleton-image"></div>
    <div class="card-body">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text" style="width: 40%;"></div>
      <div class="flex items-center gap-2 mt-4">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
      </div>
    </div>
  `;
  return card;
}
```

---

## Data Flow

```
1. Page loads → show skeleton loaders in product grid
2. Fetch 8 latest products from Supabase (with seller profile joined)
3. Replace skeletons with real product cards
4. Product cards use lazy-loaded images
5. Click on card → navigate to /products/:id
6. Click on category pill → navigate to /products?category={id}
```

---

## Verification Checklist

After completing this module, verify:

- [ ] Navbar renders with logo, search (desktop), and nav links
- [ ] Navbar shows Login/Signup when logged out, Avatar when logged in
- [ ] Navbar is sticky and has glassmorphism effect
- [ ] Hero section shows with gradient background and CTAs
- [ ] Category pills render and link to filtered product pages
- [ ] Featured products grid shows skeleton loaders then real cards
- [ ] Product cards show image, title, price, seller name, and time ago
- [ ] Product card images lazy-load with blur-up effect
- [ ] "View All" link navigates to `/products`
- [ ] How It Works section renders 3 steps
- [ ] Footer renders with branding and links
- [ ] Page is fully responsive (mobile-first)
- [ ] All animations play smoothly (staggered card entry, hero text slide-up)

---

## Next Module

→ [Module 04: Product Listing & Search](MODULE_04_PRODUCT_LISTING.md)
