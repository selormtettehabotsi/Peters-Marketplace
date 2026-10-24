import { formatPrice, timeAgo, escapeHtml, getInitials } from '../lib/format.js';
import { getCondition } from '../lib/constants.js';
import { icon } from './icons.js';

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

/**
 * Build the seller chip — a real avatar when one exists, initials otherwise.
 * @param {Object} seller
 * @returns {string} HTML
 */
function sellerAvatar(seller) {
  const name = seller?.full_name || 'Unknown seller';
  if (seller?.avatar_url) {
    return `<img src="${escapeHtml(seller.avatar_url)}" class="avatar avatar-sm" alt="" loading="lazy" />`;
  }
  return `<span class="avatar avatar-sm avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(name))}</span>`;
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
  card.setAttribute('aria-label', `${product.title}, ${formatPrice(product.price)}`);

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img
        src="${escapeHtml(cardImageUrl(product))}"
        alt="${escapeHtml(product.title)}"
        class="card-image blur-up"
        loading="lazy"
        decoding="async"
      />
      <span class="badge badge-${isSold ? 'danger' : condition.badge} product-status">
        ${escapeHtml(isSold ? 'Sold' : condition.name)}
      </span>
      ${
        showFavorite
          ? `<button class="btn btn-icon product-favorite" aria-label="Add to favorites" data-favorite>${icon('heart', { size: 16 })}</button>`
          : ''
      }
    </div>
    <div class="card-body">
      <h3 class="product-title truncate">${escapeHtml(product.title)}</h3>
      <p class="product-price">${escapeHtml(formatPrice(product.price))}</p>
      <div class="product-meta">
        ${sellerAvatar(seller)}
        <span class="truncate">${escapeHtml(seller.full_name || 'Unknown seller')}</span>
        ${seller.room_number ? `<span class="badge badge-gray" style="font-size:10px; padding:2px 6px; border-radius:4px;">${escapeHtml(seller.room_number)}</span>` : ''}
        <span style="margin-left:auto; font-size:11px; opacity:0.8;">${escapeHtml(timeAgo(product.created_at))}</span>
      </div>
    </div>
  `;

  // Blur-up: clear the blur once the image has decoded.
  const img = card.querySelector('.card-image');
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
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
