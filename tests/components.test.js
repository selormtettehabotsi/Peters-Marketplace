import { describe, it, expect, vi } from 'vitest';
import { icon, hasIcon, iconNames } from '../src/components/icons.js';
import { createProductCard, cardImageUrl, renderProductGrid } from '../src/components/product-card.js';
import { createSkeletonCard, renderSkeletonGrid } from '../src/components/skeleton-loader.js';
import { showToast } from '../src/components/toast.js';
import { showModal, showConfirmModal } from '../src/components/modal.js';
import { createImageGallery, openLightbox } from '../src/components/image-gallery.js';
import { createVideoPlayer } from '../src/components/video-player.js';
import { CATEGORIES } from '../src/lib/constants.js';

const product = {
  id: 'p1',
  title: 'HP Pavilion Laptop',
  price: '2500.00',
  category: 'electronics',
  condition: 'fairly-used',
  status: 'available',
  image_urls: ['https://cdn.test/img0.webp', 'https://cdn.test/img1.webp'],
  thumbnail_urls: ['https://cdn.test/thumb0.webp', 'https://cdn.test/thumb1.webp'],
  views_count: 12,
  created_at: new Date().toISOString(),
  profiles: { full_name: 'Kwame Mensah', avatar_url: null, room_number: 'B204' },
};

describe('icons', () => {
  it('renders an inline SVG that inherits the text colour', () => {
    const svg = icon('search');
    expect(svg).toContain('<svg');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('hides a decorative icon from screen readers', () => {
    expect(icon('search')).toContain('aria-hidden="true"');
  });

  it('labels an icon that carries meaning', () => {
    const svg = icon('search', { title: 'Search' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Search"');
    expect(svg).not.toContain('aria-hidden');
  });

  it('applies a custom size and class', () => {
    const svg = icon('search', { size: 32, className: 'big' });
    expect(svg).toContain('width="32"');
    expect(svg).toContain('class="icon big"');
  });

  it('returns an empty string and warns for an unknown icon', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(icon('does-not-exist')).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('has an icon for every product category', () => {
    for (const category of CATEGORIES) {
      expect(hasIcon(category.icon), `missing icon: ${category.icon}`).toBe(true);
    }
  });

  it('contains no emoji characters anywhere in the set', () => {
    const all = iconNames().map((n) => icon(n)).join('');
    // Covers the emoji, symbol and pictograph ranges
    expect(all).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe('cardImageUrl', () => {
  it('prefers the thumbnail over the full image', () => {
    expect(cardImageUrl(product)).toBe('https://cdn.test/thumb0.webp');
  });

  it('falls back to the full image when there is no thumbnail', () => {
    expect(cardImageUrl({ ...product, thumbnail_urls: null })).toBe('https://cdn.test/img0.webp');
  });

  it('falls back to the local placeholder when there is nothing', () => {
    expect(cardImageUrl({})).toBe('/placeholder.svg');
  });
});

describe('createProductCard', () => {
  it('renders the title, formatted price and seller room', () => {
    const card = createProductCard(product);
    expect(card.querySelector('.product-title').textContent.trim()).toBe('HP Pavilion Laptop');
    expect(card.querySelector('.product-price').textContent.trim()).toBe('GH₵ 2,500');
    expect(card.querySelector('.product-when').textContent).toContain('B204');
  });

  it('lazy-loads the image with the blur-up class', () => {
    const img = createProductCard(product).querySelector('.card-image');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.classList.contains('blur-up')).toBe(true);
  });

  it('shows the condition badge for an available product', () => {
    const badge = createProductCard(product).querySelector('.product-status');
    expect(badge.textContent.trim()).toBe('Fairly Used');
  });

  it('shows a Sold badge and greys the card for a sold product', () => {
    const card = createProductCard({ ...product, status: 'sold' });
    expect(card.querySelector('.product-status').textContent.trim()).toBe('Sold');
    expect(card.classList.contains('is-sold')).toBe(true);
  });

  it('marks a listing from the last day as new, and an old one not', () => {
    const fresh = createProductCard({ ...product, created_at: new Date().toISOString() });
    expect(fresh.querySelector('.product-new')).not.toBeNull();
    const old = createProductCard({ ...product, created_at: '2020-01-01T00:00:00Z' });
    expect(old.querySelector('.product-new')).toBeNull();
  });

  it('escapes a malicious title instead of executing it', () => {
    const card = createProductCard({
      ...product,
      title: '<img src=x onerror="alert(1)">',
    });
    expect(card.querySelector('.product-title').querySelector('img')).toBeNull();
    expect(card.querySelector('.product-title').textContent).toContain('<img');
  });

  it('navigates to the detail page when clicked', () => {
    const card = createProductCard(product);
    card.click();
    expect(window.location.hash).toBe('#/products/p1');
  });

  it('is keyboard reachable and opens on Enter', () => {
    const card = createProductCard(product);
    expect(card.getAttribute('tabindex')).toBe('0');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(window.location.hash).toBe('#/products/p1');
  });

  it('omits the favourite button unless asked for', () => {
    expect(createProductCard(product).querySelector('[data-favorite]')).toBeNull();
    expect(
      createProductCard(product, { showFavorite: true }).querySelector('[data-favorite]')
    ).not.toBeNull();
  });
});

describe('renderProductGrid', () => {
  it('replaces the grid contents by default', () => {
    const grid = document.createElement('div');
    grid.innerHTML = '<p>old</p>';
    renderProductGrid(grid, [product]);
    expect(grid.querySelectorAll('.product-card')).toHaveLength(1);
    expect(grid.textContent).not.toContain('old');
  });

  it('appends when asked, for "load more"', () => {
    const grid = document.createElement('div');
    renderProductGrid(grid, [product]);
    renderProductGrid(grid, [{ ...product, id: 'p2' }], { append: true });
    expect(grid.querySelectorAll('.product-card')).toHaveLength(2);
  });
});

describe('skeleton loaders', () => {
  it('builds a card-shaped placeholder hidden from screen readers', () => {
    const card = createSkeletonCard();
    expect(card.querySelector('.skeleton-image')).not.toBeNull();
    expect(card.getAttribute('aria-hidden')).toBe('true');
  });

  it('fills a grid with the requested number of placeholders', () => {
    const grid = document.createElement('div');
    renderSkeletonGrid(grid, 8);
    expect(grid.querySelectorAll('.product-card')).toHaveLength(8);
  });
});

describe('showToast', () => {
  it('appends a toast carrying the message', () => {
    showToast('Saved', 'success');
    const toast = document.querySelector('#toast-container .toast');
    expect(toast.textContent).toContain('Saved');
    expect(toast.classList.contains('toast-success')).toBe(true);
  });

  it('announces errors assertively', () => {
    showToast('Boom', 'error');
    expect(document.querySelector('.toast').getAttribute('role')).toBe('alert');
  });

  it('escapes HTML in the message', () => {
    showToast('<b>bold</b>');
    expect(document.querySelector('.toast-message').querySelector('b')).toBeNull();
  });

  it('uses an SVG icon rather than an emoji', () => {
    showToast('Saved', 'success');
    expect(document.querySelector('.toast-icon svg')).not.toBeNull();
  });
});

describe('modal', () => {
  it('renders the title and body', async () => {
    showModal({ title: 'Delete Listing', body: '<p>Are you sure?</p>' });
    expect(document.querySelector('.modal').textContent).toContain('Delete Listing');
    expect(document.querySelector('.modal-body').textContent).toContain('Are you sure?');
  });

  it('resolves true when the confirm action is clicked', async () => {
    const promise = showConfirmModal('Delete', 'Really?');
    document.querySelectorAll('[data-action-index]')[1].click();
    await expect(promise).resolves.toBe(true);
  });

  it('resolves false when cancelled', async () => {
    const promise = showConfirmModal('Delete', 'Really?');
    document.querySelectorAll('[data-action-index]')[0].click();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when dismissed with Escape', async () => {
    const promise = showConfirmModal('Delete', 'Really?');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await expect(promise).resolves.toBe(false);
  });

  it('removes itself from the DOM after closing', async () => {
    const promise = showConfirmModal('Delete', 'Really?');
    document.querySelectorAll('[data-action-index]')[0].click();
    await promise;
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });
});

describe('image gallery', () => {
  const urls = ['https://cdn.test/a.webp', 'https://cdn.test/b.webp', 'https://cdn.test/c.webp'];

  it('shows the first image and a thumbnail per image', () => {
    const gallery = createImageGallery(urls, 'Laptop');
    expect(gallery.querySelector('.gallery-image').src).toContain('a.webp');
    expect(gallery.querySelectorAll('.gallery-thumb')).toHaveLength(3);
  });

  it('advances with the next arrow', () => {
    const gallery = createImageGallery(urls, 'Laptop');
    gallery.querySelector('.gallery-next').click();
    expect(gallery.querySelector('.gallery-image').src).toContain('b.webp');
    expect(gallery.querySelector('.gallery-counter').textContent).toBe('2 / 3');
  });

  it('wraps around from the first image to the last', () => {
    const gallery = createImageGallery(urls, 'Laptop');
    gallery.querySelector('.gallery-prev').click();
    expect(gallery.querySelector('.gallery-image').src).toContain('c.webp');
  });

  it('jumps to the image whose thumbnail is clicked', () => {
    const gallery = createImageGallery(urls, 'Laptop');
    gallery.querySelectorAll('.gallery-thumb')[2].click();
    expect(gallery.querySelector('.gallery-image').src).toContain('c.webp');
    expect(gallery.querySelectorAll('.gallery-thumb')[2].classList.contains('active')).toBe(true);
  });

  it('responds to the arrow keys', () => {
    const gallery = createImageGallery(urls, 'Laptop');
    gallery.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(gallery.getIndex()).toBe(1);
    gallery.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(gallery.getIndex()).toBe(0);
  });

  it('hides the arrows and counter for a single image', () => {
    const gallery = createImageGallery(['https://cdn.test/only.webp'], 'Laptop');
    expect(gallery.querySelector('.gallery-next')).toBeNull();
    expect(gallery.querySelector('.gallery-counter')).toBeNull();
  });

  it('falls back to the placeholder when given no images', () => {
    const gallery = createImageGallery([], 'Laptop');
    expect(gallery.querySelector('.gallery-image').src).toContain('placeholder.svg');
  });
});

describe('lightbox', () => {
  it('stays open when the photo itself is clicked', () => {
    // Regression: the close handler was bound to the whole overlay, so
    // tapping the enlarged photo to look closer dismissed it instead.
    const box = openLightbox('https://cdn.test/a.webp', 'Laptop');
    box.querySelector('img').click();
    expect(document.querySelector('.gallery-lightbox')).not.toBeNull();
    box.close();
  });

  it('closes when the backdrop is clicked', () => {
    const box = openLightbox('https://cdn.test/a.webp', 'Laptop');
    box.click();
    expect(document.querySelector('.gallery-lightbox')).toBeNull();
  });

  it('closes via the close button', () => {
    const box = openLightbox('https://cdn.test/a.webp', 'Laptop');
    box.querySelector('.gallery-lightbox-close').click();
    expect(document.querySelector('.gallery-lightbox')).toBeNull();
  });

  it('closes on Escape', () => {
    openLightbox('https://cdn.test/a.webp', 'Laptop');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('.gallery-lightbox')).toBeNull();
  });

  it('exposes close() so a route change can dismiss it', () => {
    const box = openLightbox('https://cdn.test/a.webp', 'Laptop');
    expect(typeof box.close).toBe('function');
    box.close();
    expect(document.querySelector('.gallery-lightbox')).toBeNull();
  });
});

describe('video player', () => {
  it('does not preload the video', () => {
    const player = createVideoPlayer('https://cdn.test/v.mp4', 'https://cdn.test/a.webp', 20);
    expect(player.querySelector('video').getAttribute('preload')).toBe('none');
  });

  it('uses the first product image as the poster', () => {
    const player = createVideoPlayer('https://cdn.test/v.mp4', 'https://cdn.test/a.webp', 20);
    expect(player.querySelector('video').getAttribute('poster')).toContain('a.webp');
  });

  it('shows the duration badge', () => {
    const player = createVideoPlayer('https://cdn.test/v.mp4', null, 25);
    expect(player.querySelector('.video-duration').textContent).toBe('25s');
  });

  it('plays inline on mobile rather than going fullscreen', () => {
    const player = createVideoPlayer('https://cdn.test/v.mp4', null, 10);
    expect(player.querySelector('video').hasAttribute('playsinline')).toBe(true);
  });
});
