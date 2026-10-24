# Module 06 — Seller Dashboard

> **Status**: ✅ Complete  
> **Depends on**: Modules 00, 01, 02  
> **Estimated effort**: 2-3 hours  

---

## Objective

Build the seller dashboard where authenticated users can manage their product listings. This includes viewing all their listings (with stats), creating new listings (with image/video upload), editing existing listings, marking products as sold, and deleting products. This is the most complex module due to file uploads.

---

## Page URLs

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard Home | View all my listings + stats |
| `/dashboard/new` | New Listing | Create a new product |
| `/dashboard/edit/:id` | Edit Listing | Edit an existing product |

All routes require authentication (`authGuard`).

---

## Dashboard Home (`/dashboard`)

### Layout

```
┌──────────────────────────────────────────┐
│               NAVBAR                      │
├──────────────────────────────────────────┤
│  DASHBOARD HEADER                         │
│  "My Dashboard"                           │
│  Welcome, {full_name} — Room {room}       │
├──────────────────────────────────────────┤
│  STATS ROW                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ 📦 12   │ │ ✅ 8    │ │ 👁 245  │    │
│  │ Total   │ │ Avail.  │ │ Views   │    │
│  │ Listings│ │         │ │         │    │
│  └─────────┘ └─────────┘ └─────────┘    │
├──────────────────────────────────────────┤
│  [+ New Listing]                          │
├──────────────────────────────────────────┤
│  MY LISTINGS (table or card view)         │
│  ┌────┬─────────┬──────┬────────┬──────┐ │
│  │ 📷 │ Title   │ Price│ Status │ Act. │ │
│  ├────┼─────────┼──────┼────────┼──────┤ │
│  │ img│ iPhone  │ 2500 │ 🟢 Avl │ ✏🗑 │ │
│  │ img│ Textbook│  45  │ 🔴 Sold│ ✏🗑 │ │
│  │ img│ Charger │  30  │ 🟢 Avl │ ✏🗑 │ │
│  └────┴─────────┴──────┴────────┴──────┘ │
├──────────────────────────────────────────┤
│  EMPTY STATE (if no listings)             │
│  "You haven't listed anything yet.        │
│   Start selling to your hostel mates!"    │
│  [+ Create Your First Listing]            │
├──────────────────────────────────────────┤
│               FOOTER                      │
└──────────────────────────────────────────┘
```

### Stats Calculation

```javascript
// Fetch all seller's products
const { data: myProducts } = await supabase
  .from('products')
  .select('id, status, views_count')
  .eq('seller_id', currentUser.id);

const stats = {
  total: myProducts.length,
  available: myProducts.filter(p => p.status === 'available').length,
  sold: myProducts.filter(p => p.status === 'sold').length,
  totalViews: myProducts.reduce((sum, p) => sum + p.views_count, 0),
};
```

### Stats Card CSS

```css
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background-color: var(--color-white);
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-gray-200);
  text-align: center;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--font-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-gray-500);
  margin-top: var(--space-1);
}
```

### Listing Table/Cards

Each listing row shows:
- Thumbnail image (small)
- Product title
- Price (GH₵)
- Status badge (Available 🟢 / Sold 🔴)
- View count
- Created date
- Action buttons:
  - **Edit** → navigate to `/dashboard/edit/:id`
  - **Mark as Sold** / **Mark as Available** → toggle status
  - **Delete** → confirm modal, then delete

**On mobile**, show as cards instead of a table.

### Action: Toggle Status

```javascript
async function toggleStatus(productId, currentStatus) {
  const newStatus = currentStatus === 'available' ? 'sold' : 'available';
  const { error } = await supabase
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId)
    .eq('seller_id', currentUser.id); // Security: only own products
  
  if (!error) {
    showToast(`Product marked as ${newStatus}`, 'success');
    refreshListings();
  }
}
```

### Action: Delete Product

```javascript
async function deleteProduct(productId) {
  // Show confirmation modal first
  const confirmed = await showConfirmModal(
    'Delete Listing',
    'Are you sure? This will permanently remove this listing and all its images.'
  );
  
  if (!confirmed) return;
  
  // Delete product images from storage
  const { data: product } = await supabase
    .from('products')
    .select('image_urls, video_url')
    .eq('id', productId)
    .single();
  
  // Delete images from storage bucket
  if (product?.image_urls) {
    for (const url of product.image_urls) {
      const path = extractPathFromUrl(url);
      await supabase.storage.from('product-images').remove([path]);
    }
  }
  
  // Delete video if exists
  if (product?.video_url) {
    const path = extractPathFromUrl(product.video_url);
    await supabase.storage.from('product-videos').remove([path]);
  }
  
  // Delete product row
  await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', currentUser.id);
  
  showToast('Listing deleted', 'success');
  refreshListings();
}
```

---

## New Listing Page (`/dashboard/new`)

### Form Layout

```
┌──────────────────────────────────────────┐
│  CREATE NEW LISTING                       │
│  "Add your product to the marketplace"    │
├──────────────────────────────────────────┤
│                                           │
│  📸 IMAGE UPLOAD AREA                     │
│  ┌──────────────────────────────────────┐│
│  │  Drop images here or click to browse ││
│  │  (Max 5 images, 5MB each)            ││
│  │                                      ││
│  │  [img1] [img2] [img3] [+ Add]        ││
│  └──────────────────────────────────────┘│
│                                           │
│  🎥 VIDEO UPLOAD (optional)               │
│  ┌──────────────────────────────────────┐│
│  │  Upload a short video (max 30s, 10MB)││
│  │  [video preview]  [Remove]           ││
│  └──────────────────────────────────────┘│
│                                           │
│  Title:        [________________________] │
│  Description:  [________________________] │
│                [________________________] │
│  Price (GH₵):  [________________________] │
│  Category:     [▾ Select category      ] │
│  Condition:    [▾ Select condition      ] │
│                                           │
│  [Cancel]                [Publish Listing] │
└──────────────────────────────────────────┘
```

### Upload Widget (`src/components/upload-widget.js`)

This is the most complex component. It handles:

1. **Drag & drop** or **click to browse** file selection
2. **Image preview** — show thumbnails of selected images
3. **Reorder** images (drag to reorder, first image is the main one)
4. **Remove** individual images
5. **Client-side compression** before upload (resize to max 1200px width, convert to WebP)
6. **Progress indicator** during upload
7. **Validation** — max 5 images, max 5MB each, allowed types only

**Image compression utility** (`src/lib/image-utils.js`):

```javascript
/**
 * Compress and resize an image file before upload.
 * Converts to WebP format, resizes to max 1200px width.
 * @param {File} file - Original image file
 * @param {number} maxWidth - Max width in pixels (default 1200)
 * @param {number} quality - WebP quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height / width) * maxWidth;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(resolve, 'image/webp', quality);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a tiny thumbnail for blur-up effect.
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export async function generateThumbnail(file) {
  return compressImage(file, 300, 0.6);
}
```

**Video validation utility** (`src/lib/video-utils.js`):

```javascript
/**
 * Validate a video file: check duration (max 30s) and size (max 10MB).
 * @param {File} file - Video file
 * @returns {Promise<{valid: boolean, duration: number, error: string|null}>}
 */
export async function validateVideo(file) {
  const MAX_DURATION = 30;
  const MAX_SIZE_MB = 10;
  
  // Check file size
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, duration: 0, error: `Video must be under ${MAX_SIZE_MB}MB` };
  }

  // Check file type
  if (!file.type.startsWith('video/mp4')) {
    return { valid: false, duration: 0, error: 'Only MP4 videos are allowed' };
  }

  // Check duration
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);
      
      if (duration > MAX_DURATION) {
        resolve({ valid: false, duration, error: `Video must be 30 seconds or shorter (yours is ${duration}s)` });
      } else {
        resolve({ valid: true, duration, error: null });
      }
    };

    video.onerror = () => {
      resolve({ valid: false, duration: 0, error: 'Could not read video file' });
    };

    video.src = URL.createObjectURL(file);
  });
}
```

### File Upload to Supabase Storage (`src/lib/storage.js`)

```javascript
import { supabase } from '../supabase.js';
import { compressImage, generateThumbnail } from './image-utils.js';

/**
 * Upload a product image to Supabase Storage.
 * Compresses the image and generates a thumbnail.
 * @param {File} file - Image file
 * @param {string} userId - Seller's user ID
 * @param {string} productId - Product ID
 * @param {number} index - Image index (0-4)
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>}
 */
export async function uploadProductImage(file, userId, productId, index) {
  // Compress image
  const compressed = await compressImage(file);
  const thumbnail = await generateThumbnail(file);
  
  const imagePath = `${userId}/${productId}/image_${index}.webp`;
  const thumbPath = `${userId}/${productId}/thumb_${index}.webp`;

  // Upload main image
  const { error: imgErr } = await supabase.storage
    .from('product-images')
    .upload(imagePath, compressed, { contentType: 'image/webp', upsert: true });
  
  if (imgErr) throw imgErr;

  // Upload thumbnail
  const { error: thumbErr } = await supabase.storage
    .from('product-images')
    .upload(thumbPath, thumbnail, { contentType: 'image/webp', upsert: true });
  
  if (thumbErr) throw thumbErr;

  // Get public URLs
  const { data: imgData } = supabase.storage.from('product-images').getPublicUrl(imagePath);
  const { data: thumbData } = supabase.storage.from('product-images').getPublicUrl(thumbPath);

  return {
    imageUrl: imgData.publicUrl,
    thumbnailUrl: thumbData.publicUrl,
  };
}

/**
 * Upload a product video.
 * @param {File} file - Video file (MP4, max 10MB, max 30s)
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<string>} - Video public URL
 */
export async function uploadProductVideo(file, userId, productId) {
  const videoPath = `${userId}/${productId}/video.mp4`;

  const { error } = await supabase.storage
    .from('product-videos')
    .upload(videoPath, file, { contentType: 'video/mp4', upsert: true });
  
  if (error) throw error;

  const { data } = supabase.storage.from('product-videos').getPublicUrl(videoPath);
  return data.publicUrl;
}
```

### Form Submission Flow

```
1. User fills out form + selects images + (optional) video
2. Click "Publish Listing"
3. Show loading state on button ("Publishing...")
4. Validate all fields client-side
5. Generate a product UUID (client-side: crypto.randomUUID())
6. Upload images to Supabase Storage → get URLs
7. Upload video if present → get URL
8. Insert product row into database with all URLs
9. Show success toast: "Listing published! 🎉"
10. Navigate to /dashboard
```

```javascript
async function handleSubmit(formData, images, video) {
  const productId = crypto.randomUUID();
  const userId = getUser().id;
  
  // 1. Upload images
  const imageUrls = [];
  const thumbnailUrls = [];
  for (let i = 0; i < images.length; i++) {
    const { imageUrl, thumbnailUrl } = await uploadProductImage(images[i], userId, productId, i);
    imageUrls.push(imageUrl);
    thumbnailUrls.push(thumbnailUrl);
  }

  // 2. Upload video (if any)
  let videoUrl = null;
  let videoDuration = null;
  if (video) {
    videoUrl = await uploadProductVideo(video.file, userId, productId);
    videoDuration = video.duration;
  }

  // 3. Insert product
  const { error } = await supabase.from('products').insert({
    id: productId,
    seller_id: userId,
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
    price: parseFloat(formData.price),
    category: formData.category,
    condition: formData.condition,
    image_urls: imageUrls,
    thumbnail_urls: thumbnailUrls,
    video_url: videoUrl,
    video_duration: videoDuration,
  });

  if (error) throw error;
}
```

---

## Edit Listing Page (`/dashboard/edit/:id`)

Same form as "New Listing" but pre-filled with existing data:

1. Fetch the product by ID (verify `seller_id === currentUser.id`)
2. Pre-fill all form fields
3. Show existing images as thumbnails (with option to remove)
4. Allow adding new images (up to the 5 limit)
5. Show existing video (with option to remove or replace)
6. "Save Changes" button → update the product row

**Important**: When removing an image, also delete it from Supabase Storage.

---

## Verification Checklist

After completing this module, verify:

- [ ] Dashboard shows seller's stats (total, available, sold, views)
- [ ] Dashboard lists all seller's products with image, title, price, status
- [ ] "Mark as Sold" / "Mark as Available" toggle works
- [ ] Delete product works (with confirmation modal)
- [ ] Delete also removes images/video from Supabase Storage
- [ ] "New Listing" form renders with all fields
- [ ] Image upload supports drag-and-drop and click-to-browse
- [ ] Image previews show after selection
- [ ] Images are compressed client-side before upload (WebP, max 1200px)
- [ ] Thumbnails are generated (300px width)
- [ ] Video upload validates duration (max 30 seconds)
- [ ] Video upload validates size (max 10MB)
- [ ] Video upload validates type (MP4 only)
- [ ] Form validation shows inline errors for required fields
- [ ] Successful publish navigates to dashboard with success toast
- [ ] Edit page pre-fills all fields with existing data
- [ ] Edit page allows adding/removing images
- [ ] Only the product owner can edit/delete (enforced by RLS)
- [ ] Banned users cannot create new listings

---

## Next Module

→ [Module 07: Admin Panel](MODULE_07_ADMIN_PANEL.md)
