# Module 04 — Product Listing & Search

> **Status**: ✅ Complete  
> **Depends on**: Modules 00, 01, 02  
> **Estimated effort**: 2-3 hours  

---

## Objective

Build the main product browsing page where users can view all available listings, search by keyword, filter by category/condition/price range, and sort results. This is the core discovery page — it must load fast with skeleton loaders, support lazy-loading images, and work well on slow networks.

---

## Page URL

`/products` — also handles query parameters:
- `/products?q=laptop` — search by keyword
- `/products?category=electronics` — filter by category
- `/products?condition=new` — filter by condition
- `/products?sort=price-low` — sort order
- `/products?q=phone&category=electronics&sort=newest` — combined

---

## Page Layout

```
┌──────────────────────────────────────────┐
│               NAVBAR                      │
├──────────────────────────────────────────┤
│  PAGE HEADER                              │
│  "All Products" (or "Results for 'laptop'")│
├──────────────────────────────────────────┤
│  SEARCH BAR (full width)                  │
│  🔍 [Search products...        ] [Search] │
├──────────────────────────────────────────┤
│  FILTER BAR                               │
│  Categories: [All] [🍕 Food] [📱 Elec]    │
│  Condition:  [All] [New] [Fairly Used]    │
│  Sort:       [Newest ▾]                   │
├──────────────────────────────────────────┤
│  RESULTS COUNT: "Showing 24 products"     │
├──────────────────────────────────────────┤
│  PRODUCT GRID (responsive)                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ Card │  │ Card │  │ Card │  │ Card │ │
│  └──────┘  └──────┘  └──────┘  └──────┘ │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ Card │  │ Card │  │ Card │  │ Card │ │
│  └──────┘  └──────┘  └──────┘  └──────┘ │
├──────────────────────────────────────────┤
│  LOAD MORE BUTTON                         │
│  [Load More Products]                     │
│  or "No more products"                    │
├──────────────────────────────────────────┤
│  EMPTY STATE (if no results)              │
│  "No products found. Try a different      │
│   search or category."                    │
├──────────────────────────────────────────┤
│               FOOTER                      │
└──────────────────────────────────────────┘
```

---

## Implementation Details

### Search Functionality

**Client-side search input:**
```javascript
// Debounce search input (300ms) to avoid excessive API calls
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    updateFilters({ q: e.target.value });
  }, 300);
});
```

**Supabase query with search:**
```javascript
let query = supabase
  .from('products')
  .select('*, profiles!seller_id(full_name, avatar_url)', { count: 'exact' })
  .eq('status', 'available')
  .eq('is_flagged', false);

// Text search (searches title and description)
if (filters.q) {
  query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
}

// Category filter
if (filters.category && filters.category !== 'all') {
  query = query.eq('category', filters.category);
}

// Condition filter
if (filters.condition && filters.condition !== 'all') {
  query = query.eq('condition', filters.condition);
}

// Price range filter
if (filters.minPrice) {
  query = query.gte('price', filters.minPrice);
}
if (filters.maxPrice) {
  query = query.lte('price', filters.maxPrice);
}

// Sorting
const sortOption = SORT_OPTIONS.find(s => s.id === filters.sort) || SORT_OPTIONS[0];
query = query.order(sortOption.column, { ascending: sortOption.ascending });

// Pagination
const pageSize = 12;
const from = page * pageSize;
const to = from + pageSize - 1;
query = query.range(from, to);

const { data: products, count, error } = await query;
```

### Filter Bar UI

**Category pills** — horizontal scrollable, "All" selected by default:
```html
<div class="filter-bar">
  <div class="filter-group">
    <label class="filter-label">Category</label>
    <div class="pill-group">
      <button class="pill active" data-category="all">All</button>
      <button class="pill" data-category="food-snacks">🍕 Food</button>
      <button class="pill" data-category="electronics">📱 Electronics</button>
      <!-- ... etc -->
    </div>
  </div>
  
  <div class="filter-row flex gap-4 flex-wrap">
    <div class="filter-group">
      <label class="filter-label">Condition</label>
      <select class="form-select" id="filter-condition">
        <option value="all">All Conditions</option>
        <option value="new">New</option>
        <option value="fairly-used">Fairly Used</option>
        <option value="used">Used</option>
      </select>
    </div>
    
    <div class="filter-group">
      <label class="filter-label">Sort By</label>
      <select class="form-select" id="filter-sort">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="price-low">Price: Low → High</option>
        <option value="price-high">Price: High → Low</option>
        <option value="popular">Most Viewed</option>
      </select>
    </div>
  </div>
</div>
```

**Filter bar CSS:**
```css
.filter-bar {
  margin-bottom: var(--space-6);
}

.filter-group {
  margin-bottom: var(--space-4);
}

.filter-label {
  display: block;
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
  margin-bottom: var(--space-2);
}

.filter-row {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.filter-row .form-select {
  width: auto;
  min-width: 180px;
}

.results-count {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-bottom: var(--space-4);
}
```

### Pagination (Load More)

Use **"Load More" button** instead of traditional pagination (better UX on mobile):

```javascript
let currentPage = 0;
const PAGE_SIZE = 12;

async function loadMore() {
  currentPage++;
  const newProducts = await fetchProducts(currentPage);
  appendProductCards(newProducts); // Append, don't replace
  
  // Hide "Load More" if no more results
  if (newProducts.length < PAGE_SIZE) {
    loadMoreBtn.classList.add('hidden');
  }
}
```

### Loading States

1. **Initial load**: Show 8 skeleton cards in the grid
2. **Filter change**: Show a subtle opacity fade on the grid while refetching
3. **Load More**: Show spinner inside the button

### URL Sync

Keep the URL in sync with filters so users can share links:
```javascript
function updateURL(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.condition && filters.condition !== 'all') params.set('condition', filters.condition);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  
  const hash = '/products' + (params.toString() ? '?' + params.toString() : '');
  history.replaceState(null, '', '#' + hash);
}

function readFiltersFromURL() {
  const hash = window.location.hash.slice(1);
  const url = new URL(hash, window.location.origin);
  return {
    q: url.searchParams.get('q') || '',
    category: url.searchParams.get('category') || 'all',
    condition: url.searchParams.get('condition') || 'all',
    sort: url.searchParams.get('sort') || 'newest',
  };
}
```

---

## Empty State

When no products match the search/filter:

```html
<div class="empty-state">
  <div class="empty-icon">🔍</div>
  <div class="empty-title">No products found</div>
  <div class="empty-description">
    Try a different search term or browse all categories.
  </div>
  <a href="#/products" class="btn btn-primary">Browse All Products</a>
</div>
```

---

## Performance Optimizations

| Optimization | Implementation |
|-------------|----------------|
| **Debounced search** | 300ms delay before firing API call |
| **Skeleton loaders** | 8 skeleton cards shown during fetch |
| **Lazy images** | `loading="lazy"` on all product card images |
| **Blur-up effect** | Thumbnail loads first (blurry), then full image |
| **Pagination** | Load 12 at a time, not all at once |
| **URL caching** | PWA service worker caches API responses (5 min) |

---

## Verification Checklist

After completing this module, verify:

- [ ] `/products` page renders with search bar, filters, and product grid
- [ ] Skeleton loaders appear while products fetch
- [ ] Product cards render with correct data (image, title, price, seller)
- [ ] Search by keyword works (searches title and description)
- [ ] Category filter works (pills highlight active category)
- [ ] Condition filter works (dropdown)
- [ ] Sort options work (newest, price low/high, popular)
- [ ] "Load More" button loads next page of results
- [ ] Empty state shows when no products match
- [ ] URL updates with filters (shareable links)
- [ ] On initial load, reads filters from URL (e.g., from category pill link on homepage)
- [ ] All images lazy-load
- [ ] Page is responsive (1 column mobile, 2 tablet, 3-4 desktop)

---

## Next Module

→ [Module 05: Product Detail Page](MODULE_05_PRODUCT_DETAIL.md)
