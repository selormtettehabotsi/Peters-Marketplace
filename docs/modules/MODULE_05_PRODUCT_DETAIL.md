# Module 05 — Product Detail Page

> **Status**: ✅ Complete  
> **Depends on**: Modules 00, 01, 04  
> **Estimated effort**: 1-2 hours  

---

## Objective

Build the single product detail page. When a user clicks on a product card anywhere in the app, they land here. This page shows all product info: image gallery (swipeable), video player (if video exists), full description, seller info, and contact buttons (WhatsApp + Phone). It also increments the view counter.

---

## Page URL

`/products/:id` — where `:id` is the product's UUID.

---

## Page Layout

```
┌──────────────────────────────────────────┐
│               NAVBAR                      │
├──────────────────────────────────────────┤
│  ← Back to Products                      │
├──────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────┐  │
│  │                  │  │ PRODUCT INFO  │  │
│  │  IMAGE GALLERY   │  │              │  │
│  │  (swipeable)     │  │ Title        │  │
│  │                  │  │ GH₵ Price    │  │
│  │  ○ ○ ● ○ ○      │  │ [New] badge  │  │
│  │                  │  │              │  │
│  │  [▶ Video]       │  │ Description  │  │
│  │                  │  │              │  │
│  └──────────────────┘  │ ──────────── │  │
│                        │ SELLER INFO  │  │
│                        │ 👤 Name      │  │
│                        │ 🏠 Room B204 │  │
│                        │              │  │
│                        │ [WhatsApp]   │  │
│                        │ [Phone Call] │  │
│                        │              │  │
│                        │ Listed 2h ago│  │
│                        │ 👁 12 views  │  │
│                        └──────────────┘  │
├──────────────────────────────────────────┤
│  RELATED PRODUCTS (same category)         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ Card │  │ Card │  │ Card │  │ Card │ │
│  └──────┘  └──────┘  └──────┘  └──────┘ │
├──────────────────────────────────────────┤
│               FOOTER                      │
└──────────────────────────────────────────┘
```

**On mobile**, the layout stacks vertically: gallery on top, info below.

---

## Implementation Details

### Data Fetching

```javascript
// Fetch product with seller profile
const { data: product, error } = await supabase
  .from('products')
  .select('*, profiles!seller_id(*)')
  .eq('id', productId)
  .single();

if (error || !product) {
  // Show 404 state
  return;
}

// Increment view count (fire-and-forget, don't await)
supabase
  .from('products')
  .update({ views_count: product.views_count + 1 })
  .eq('id', productId);

// Fetch 4 related products (same category, different product)
const { data: related } = await supabase
  .from('products')
  .select('*, profiles!seller_id(full_name, avatar_url)')
  .eq('category', product.category)
  .eq('status', 'available')
  .neq('id', productId)
  .limit(4);
```

### Image Gallery (`src/components/image-gallery.js`)

A swipeable image gallery that shows all product images.

**Features:**
- Shows the main/active image large
- Thumbnail strip below for selecting images
- Swipe left/right on mobile (touch events)
- Arrow buttons on desktop
- Dot indicators showing current position
- Lazy loads images that aren't currently visible
- Lightbox on click (full-screen view)

**Export:**
```javascript
/**
 * Create an image gallery component.
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} altText - Alt text base for accessibility
 * @returns {HTMLElement}
 */
export function createImageGallery(imageUrls, altText) {
  // Build gallery DOM
  // Add touch swipe handlers
  // Add arrow button handlers
  // Return the element
}
```

**Gallery HTML structure:**
```html
<div class="gallery">
  <div class="gallery-main">
    <img src="{activeImage}" alt="{altText}" class="gallery-image" loading="lazy" />
    <button class="gallery-arrow gallery-prev" aria-label="Previous image">‹</button>
    <button class="gallery-arrow gallery-next" aria-label="Next image">›</button>
    <!-- Image counter -->
    <span class="gallery-counter">1 / 5</span>
  </div>
  <div class="gallery-thumbs">
    <img src="{thumbnail_urls[0]}" class="gallery-thumb active" data-index="0" />
    <img src="{thumbnail_urls[1]}" class="gallery-thumb" data-index="1" />
    <!-- ... -->
  </div>
</div>
```

**Gallery CSS:**
```css
.gallery {
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.gallery-main {
  position: relative;
  aspect-ratio: 4 / 3;
  background-color: var(--color-gray-100);
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: var(--color-gray-100);
}

.gallery-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
  opacity: 0;
}

.gallery-main:hover .gallery-arrow {
  opacity: 1;
}

.gallery-prev { left: var(--space-3); }
.gallery-next { right: var(--space-3); }

.gallery-counter {
  position: absolute;
  bottom: var(--space-3);
  right: var(--space-3);
  background: rgba(0, 0, 0, 0.6);
  color: var(--color-white);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-xs);
}

.gallery-thumbs {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  overflow-x: auto;
}

.gallery-thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-md);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
  border: 2px solid transparent;
  flex-shrink: 0;
}

.gallery-thumb.active,
.gallery-thumb:hover {
  opacity: 1;
  border-color: var(--color-primary);
}
```

### Video Player (`src/components/video-player.js`)

If the product has a video, show it below the image gallery.

**Features:**
- Native `<video>` element with controls
- Poster image (first product image as poster)
- Lazy load — video only loads when user clicks play
- Max 30 seconds duration enforced
- Compact design

```html
<div class="video-player" id="product-video">
  <video 
    src="{video_url}" 
    poster="{image_urls[0]}"
    controls 
    preload="none"
    playsinline
    class="video-element"
  >
    Your browser does not support video playback.
  </video>
  <span class="video-duration">{video_duration}s</span>
</div>
```

**CSS:**
```css
.video-player {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-top: var(--space-4);
  background-color: var(--color-gray-900);
}

.video-element {
  width: 100%;
  display: block;
}

.video-duration {
  position: absolute;
  bottom: var(--space-3);
  right: var(--space-3);
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-white);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
}
```

### Product Info Panel

```html
<div class="product-info">
  <!-- Status -->
  <span class="badge badge-{statusColor}">{status}</span>
  
  <!-- Title -->
  <h1 class="product-detail-title">{title}</h1>
  
  <!-- Price -->
  <p class="product-detail-price">GH₵ {price}</p>
  
  <!-- Condition & Category -->
  <div class="product-tags">
    <span class="badge badge-{conditionColor}">{condition}</span>
    <span class="badge badge-gray">{categoryEmoji} {categoryName}</span>
  </div>
  
  <!-- Description -->
  <div class="product-description">
    <h3>Description</h3>
    <p>{description || 'No description provided.'}</p>
  </div>
  
  <div class="divider"></div>
  
  <!-- Seller Info -->
  <div class="seller-info">
    <h3>Seller</h3>
    <div class="seller-card flex items-center gap-4">
      <img src="{seller.avatar_url}" class="avatar avatar-lg" alt="{seller.full_name}" />
      <div>
        <p class="font-semibold">{seller.full_name}</p>
        <p class="text-sm text-muted">🏠 Room {seller.room_number}</p>
      </div>
    </div>
  </div>
  
  <!-- Contact Buttons -->
  <div class="contact-buttons">
    <a href="https://wa.me/{whatsapp}?text=Hi, I'm interested in '{title}' on SP Market" 
       target="_blank" 
       class="btn btn-whatsapp btn-lg btn-full">
      💬 Chat on WhatsApp
    </a>
    <a href="tel:{phone}" 
       class="btn btn-call btn-lg btn-full">
      📞 Call Seller
    </a>
  </div>
  
  <!-- Meta -->
  <div class="product-meta-detail text-sm text-muted">
    <span>📅 Listed {timeAgo(created_at)}</span>
    <span>👁 {views_count} views</span>
  </div>
</div>
```

**CSS for product detail:**
```css
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  padding-top: var(--space-8);
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
  }
}

.product-detail-title {
  font-size: var(--font-3xl);
  margin: var(--space-3) 0;
}

.product-detail-price {
  font-size: var(--font-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--space-4);
}

.product-tags {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.product-description {
  margin-bottom: var(--space-6);
}

.product-description h3 {
  font-size: var(--font-base);
  margin-bottom: var(--space-2);
}

.seller-info {
  margin-bottom: var(--space-6);
}

.seller-card {
  margin-top: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-gray-50);
  border-radius: var(--radius-lg);
}

.contact-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.product-meta-detail {
  display: flex;
  gap: var(--space-6);
}

/* Back button */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-gray-500);
  font-size: var(--font-sm);
  padding: var(--space-4) 0;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}
```

### Sold Product State

If the product `status === 'sold'`:
- Show a "SOLD" badge prominently (red)
- Disable the WhatsApp and Phone buttons
- Show "This item has been sold" message
- Gray out the price

---

## 404 State (Product Not Found)

If the product ID doesn't match any product:

```html
<div class="empty-state">
  <div class="empty-icon">🤷</div>
  <div class="empty-title">Product Not Found</div>
  <div class="empty-description">This listing may have been removed or doesn't exist.</div>
  <a href="#/products" class="btn btn-primary">Browse Products</a>
</div>
```

---

## Verification Checklist

After completing this module, verify:

- [ ] Product detail page loads with correct data from URL param
- [ ] Image gallery shows all images with thumbnails
- [ ] Gallery supports swipe on mobile and arrow keys on desktop
- [ ] Video player shows (only if product has a video)
- [ ] Video uses `preload="none"` (lazy load)
- [ ] Title, price, condition, category, description all render correctly
- [ ] Seller info shows name, room number, and avatar
- [ ] WhatsApp button opens correct URL with pre-filled message
- [ ] Phone call button opens `tel:` link
- [ ] View count increments on page load
- [ ] "SOLD" state disables contact buttons
- [ ] 404 state shows for invalid product IDs
- [ ] "Back to Products" link works
- [ ] Related products grid shows 4 items from same category
- [ ] Page is responsive (2-column desktop, stacked mobile)

---

## Next Module

→ [Module 06: Seller Dashboard](MODULE_06_SELLER_DASHBOARD.md)
