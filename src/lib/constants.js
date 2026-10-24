// Product categories. `icon` is a key into src/components/icons.js —
// the UI uses inline SVG throughout, never emoji.
export const CATEGORIES = [
  { id: 'food-snacks', name: 'Food & Snacks', icon: 'food-snacks' },
  { id: 'electronics', name: 'Electronics', icon: 'electronics' },
  { id: 'books', name: 'Books', icon: 'books' },
  { id: 'clothing', name: 'Clothing', icon: 'clothing' },
  { id: 'services', name: 'Services', icon: 'services' },
  { id: 'others', name: 'Others', icon: 'others' },
];

// Product conditions
export const CONDITIONS = [
  { id: 'new', name: 'New', color: 'var(--color-success)', badge: 'success' },
  { id: 'fairly-used', name: 'Fairly Used', color: 'var(--color-accent)', badge: 'warning' },
  { id: 'used', name: 'Used', color: 'var(--color-gray-500)', badge: 'gray' },
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

// Products fetched per page on the listing screen
export const PAGE_SIZE = 12;

/** Look up a category descriptor by id. */
export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || { id, name: id, icon: 'others' };
}

/** Look up a condition descriptor by id. */
export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id) || { id, name: id, badge: 'gray' };
}
