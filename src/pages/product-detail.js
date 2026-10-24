import { fetchProduct, fetchRelatedProducts, incrementViews } from '../lib/api.js';
import { getCategory, getCondition } from '../lib/constants.js';
import {
  formatPrice,
  timeAgo,
  escapeHtml,
  getInitials,
  buildWhatsAppLink,
} from '../lib/format.js';
import { createImageGallery } from '../components/image-gallery.js';
import { createVideoPlayer } from '../components/video-player.js';
import { renderProductGrid } from '../components/product-card.js';
import { renderSkeletonGrid } from '../components/skeleton-loader.js';
import { icon } from '../components/icons.js';
import { watchNavigation } from '../router.js';

/** Shown when the id in the URL matches nothing. */
function renderNotFound(container) {
  container.innerHTML = `
    <div class="container">
      <div class="empty-state">
        <div class="empty-icon">${icon('search', { size: 32 })}</div>
        <div class="empty-title">Product Not Found</div>
        <div class="empty-description">This listing may have been removed or doesn't exist.</div>
        <a href="#/products" class="btn btn-primary">Browse Products</a>
      </div>
    </div>
  `;
}

/**
 * Product detail page.
 * @param {Object} params - { id }
 * @param {HTMLElement} container
 */
export default async function renderProductDetail(params, container) {
  const { id } = params;
  const isStale = watchNavigation();

  container.innerHTML = `
    <div class="container">
      <div class="product-detail">
        <div><div class="skeleton skeleton-image" style="border-radius: var(--radius-xl);"></div></div>
        <div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text" style="width:30%;"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-button mt-6"></div>
        </div>
      </div>
    </div>
  `;

  const { product, error } = await fetchProduct(id);
  if (isStale()) return;

  if (error || !product) {
    renderNotFound(container);
    return;
  }

  // Fire-and-forget — a failed counter must not break the page.
  incrementViews(id, product.views_count);

  const seller = product.profiles || {};
  const category = getCategory(product.category);
  const condition = getCondition(product.condition);
  const isSold = product.status === 'sold';
  const whatsappNumber = seller.whatsapp || seller.phone;

  container.innerHTML = `
    <div class="container">
      <a href="#/products" class="back-link">
        ${icon('arrow-left', { size: 16 })} Back to Products
      </a>

      <div class="product-detail">
        <div id="media-column"></div>

        <div class="product-info">
          <span class="badge badge-${isSold ? 'danger' : 'success'}">
            ${isSold ? 'Sold' : 'Available'}
          </span>

          <h1 class="product-detail-title">${escapeHtml(product.title)}</h1>
          <p class="product-detail-price${isSold ? ' is-sold' : ''}">
            ${escapeHtml(formatPrice(product.price))}
          </p>

          <div class="product-tags">
            <span class="badge badge-${condition.badge}">${escapeHtml(condition.name)}</span>
            <span class="badge badge-gray">
              ${icon(category.icon, { size: 14 })} ${escapeHtml(category.name)}
            </span>
          </div>

          <div class="product-description">
            <h3>Description</h3>
            <p>${escapeHtml(product.description || 'No description provided.')}</p>
          </div>

          <div class="divider"></div>

          <div class="seller-info">
            <h3>Seller</h3>
            <div class="seller-card flex items-center gap-4">
              ${
                seller.avatar_url
                  ? `<img src="${escapeHtml(seller.avatar_url)}" class="avatar avatar-lg" alt="" />`
                  : `<span class="avatar avatar-lg avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(seller.full_name))}</span>`
              }
              <div>
                <p class="font-semibold" style="margin:0;">
                  ${escapeHtml(seller.full_name || 'Unknown seller')}
                </p>
                <p class="text-sm text-muted icon-row" style="margin:0;">
                  ${icon('home', { size: 14 })} Room ${escapeHtml(seller.room_number || 'N/A')}
                </p>
              </div>
            </div>
          </div>

          ${
            isSold
              ? `<div class="sold-notice">This item has been sold.</div>`
              : `
            <div class="contact-buttons">
              <a
                href="${escapeHtml(buildWhatsAppLink(whatsappNumber, product.title))}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-whatsapp btn-lg btn-full${whatsappNumber ? '' : ' disabled'}"
              >
                ${icon('whatsapp', { size: 18 })} Chat on WhatsApp
              </a>
              <a
                href="tel:${escapeHtml(seller.phone || '')}"
                class="btn btn-call btn-lg btn-full${seller.phone ? '' : ' disabled'}"
              >
                ${icon('phone', { size: 18 })} Call Seller
              </a>
            </div>
          `
          }

          <div class="product-meta-detail text-sm text-muted">
            <span class="icon-row">
              ${icon('calendar', { size: 14 })} Listed ${escapeHtml(timeAgo(product.created_at))}
            </span>
            <span class="icon-row">
              ${icon('eye', { size: 14 })} ${Number(product.views_count || 0)} views
            </span>
          </div>
        </div>
      </div>

      <section class="section" id="related-section">
        <h2 class="mb-6">More in ${escapeHtml(category.name)}</h2>
        <div class="product-grid stagger-children" id="related-grid"></div>
      </section>
    </div>
  `;

  // Media column: gallery, plus the video when one exists
  const mediaColumn = container.querySelector('#media-column');
  mediaColumn.appendChild(
    createImageGallery(product.image_urls, product.title, product.thumbnail_urls || [])
  );

  if (product.video_url) {
    mediaColumn.appendChild(
      createVideoPlayer(product.video_url, product.image_urls?.[0], product.video_duration)
    );
  }

  // Related products
  const relatedGrid = container.querySelector('#related-grid');
  renderSkeletonGrid(relatedGrid, 4);

  const { products: related } = await fetchRelatedProducts(product.category, product.id, 4);
  if (isStale()) return;

  if (!related.length) {
    container.querySelector('#related-section').remove();
    return;
  }

  renderProductGrid(relatedGrid, related);
}
