import { formatPrice, timeAgo, escapeHtml } from '../lib/format.js';
import { getCondition } from '../lib/constants.js';
import { icon } from './icons.js';
import { fitPhoto } from '../lib/photo-fit.js';

/**
 * Pick the image to show in a card: prefer the small thumbnail, fall back
 * to the full-size image, and finally to a local placeholder.
 * @param {Object} product
 * @returns {string}
 */
export function cardImageUrl(product) {
  return (
    product?.thumbnail_urls?.[0] ||
    product?.image_urls?.[0] ||
    '/placeholder.svg'
  );
}

/** Listings younger than this get a NEW marker. */
const NEW_FOR_MS = 24 * 60 * 60 * 1000;

/** Card photo frame, width / height (matches .card-image in components.css). */
const CARD_RATIO = 4 / 5;

/**
 * Listings uploaded before thumbnails were enlarged have 300px-wide thumbs,
 * which look soft on a phone's high-density screen. When the loaded thumb
 * is clearly too small for the card it's shown in, swap in the full photo.
 * New uploads have thumbs big enough, so they keep the lighter file.
 * @param {HTMLImageElement} img
 * @param {Object} product
 */
function upgradeIfBlurry(img, product) {
  const full = product.image_urls?.[0];
  if (!full || img.src === full) return;
  const needed = img.clientWidth * (window.devicePixelRatio || 1) * 0.75;
  if (img.naturalWidth && needed && img.naturalWidth < needed) img.src = full;
}

/**
 * Create a product card DOM element.
 * @param {Object} product - product row with a joined `profiles` seller
 * @param {Object} [options] - { showFavorite }
 * @returns {HTMLElement}
 */
export function createProductCard(product, options = {}) {
  const { showFavorite = false } = options;
  const seller = product.profiles || {};
  const condition = getCondition(product.condition);
  const isSold = product.status === 'sold';

  const card = document.createElement('article');
  card.className = `card product-card${isSold ? ' is-sold' : ''}`;
  card.dataset.productId = product.id;
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');
  card.setAttribute(
    'aria-label',
    `${product.title}, ${formatPrice(product.price)}${isSold ? ', sold' : ''}`
  );

  const isNew = !isSold && Date.now() - new Date(product.created_at).getTime() < NEW_FOR_MS;
  // "B204 · 2h" — room and age, the two things a hostel buyer scans for
  const where = [seller.room_number, timeAgo(product.created_at).replace(/ ago$/, '')]
    .filter(Boolean)
    .join(' · ');

  card.innerHTML = `
    <div class="product-kicker">
      <span class="product-status">${escapeHtml(isSold ? 'Sold' : condition.name)}</span>
      ${isNew ? '<span class="product-new">Just in</span>' : ''}
    </div>
    <div class="card-image-wrapper photo-frame">
      <img
        src="${escapeHtml(cardImageUrl(product))}"
        alt="${escapeHtml(product.title)}"
        class="card-image blur-up"
        loading="lazy"
        decoding="async"
      />
      ${
        showFavorite
          ? `<button class="btn btn-icon product-favorite" aria-label="Add to favorites" data-favorite>${icon('heart', { size: 16 })}</button>`
          : ''
      }
    </div>
    <h3 class="product-title line-clamp-2">${escapeHtml(product.title)}</h3>
    <div class="product-meta">
      <span class="product-price">${escapeHtml(formatPrice(product.price))}</span>
      <span class="product-when">${escapeHtml(where)}</span>
    </div>
  `;

  // Blur-up: clear the blur once the image has decoded.
  const img = card.querySelector('.card-image');
  fitPhoto(img, { frameRatio: CARD_RATIO });
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    img.addEventListener('load', () => upgradeIfBlurry(img, product), { once: true });
    img.addEventListener(
      'error',
      () => {
        img.src = '/placeholder.svg';
        img.classList.add('loaded');
      },
      { once: true }
    );
  }

  const open = () => {
    window.location.hash = `#/products/${product.id}`;
  };

  card.addEventListener('click', (e) => {
    // The favourite button is a separate control, not a link to the product.
    if (e.target.closest('[data-favorite]')) return;
    open();
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  return card;
}

/**
 * Render a list of products into a grid container.
 * @param {HTMLElement} container
 * @param {Array} products
 * @param {Object} [options] - { append, showFavorite }
 */
export function renderProductGrid(container, products, options = {}) {
  if (!container) return;
  const { append = false } = options;

  if (!append) container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (const product of products) {
    fragment.appendChild(createProductCard(product, options));
  }
  container.appendChild(fragment);
}
