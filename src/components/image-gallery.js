import { escapeHtml } from '../lib/format.js';
import { icon } from './icons.js';

const SWIPE_THRESHOLD_PX = 40;

/**
 * Create a swipeable image gallery.
 * @param {string[]} imageUrls - full-size image URLs (at least one)
 * @param {string} altText - base alt text, suffixed with the image number
 * @param {string[]} [thumbUrls] - optional smaller URLs for the thumb strip
 * @returns {HTMLElement}
 */
export function createImageGallery(imageUrls, altText, thumbUrls = []) {
  const images = imageUrls?.length ? imageUrls : ['/placeholder.svg'];
  let index = 0;

  const gallery = document.createElement('div');
  gallery.className = 'gallery';
  gallery.innerHTML = `
    <div class="gallery-main">
      <img
        src="${escapeHtml(images[0])}"
        alt="${escapeHtml(altText)} — image 1 of ${images.length}"
        class="gallery-image"
        id="gallery-active"
      />
      ${
        images.length > 1
          ? `
        <button class="gallery-arrow gallery-prev" aria-label="Previous image">${icon('chevron-left')}</button>
        <button class="gallery-arrow gallery-next" aria-label="Next image">${icon('chevron-right')}</button>
        <span class="gallery-counter" aria-live="polite">1 / ${images.length}</span>
      `
          : ''
      }
    </div>
    ${
      images.length > 1
        ? `
      <div class="gallery-thumbs" role="tablist" aria-label="Product images">
        ${images
          .map(
            (url, i) => `
          <img
            src="${escapeHtml(thumbUrls[i] || url)}"
            class="gallery-thumb${i === 0 ? ' active' : ''}"
            data-index="${i}"
            alt="Show image ${i + 1}"
            role="tab"
            tabindex="0"
            aria-selected="${i === 0}"
            loading="lazy"
          />
        `
          )
          .join('')}
      </div>
    `
        : ''
    }
  `;

  const main = gallery.querySelector('#gallery-active');
  const counter = gallery.querySelector('.gallery-counter');
  const thumbs = gallery.querySelectorAll('.gallery-thumb');

  /** Show the image at `next`, wrapping around both ends. */
  function show(next) {
    index = (next + images.length) % images.length;
    main.src = images[index];
    main.alt = `${altText} — image ${index + 1} of ${images.length}`;
    if (counter) counter.textContent = `${index + 1} / ${images.length}`;
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === index);
      t.setAttribute('aria-selected', String(i === index));
    });
  }

  gallery.querySelector('.gallery-prev')?.addEventListener('click', () => show(index - 1));
  gallery.querySelector('.gallery-next')?.addEventListener('click', () => show(index + 1));

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => show(Number(thumb.dataset.index)));
    thumb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(Number(thumb.dataset.index));
      }
    });
  });

  // Arrow keys when the gallery has focus
  gallery.setAttribute('tabindex', '0');
  gallery.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(index + 1);
    }
  });

  // Touch swipe on mobile
  let touchStartX = 0;
  const mainWrap = gallery.querySelector('.gallery-main');
  mainWrap.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  mainWrap.addEventListener(
    'touchend',
    (e) => {
      const delta = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
      show(delta < 0 ? index + 1 : index - 1);
    },
    { passive: true }
  );

  // Click the main image for a full-screen view
  main.addEventListener('click', () => openLightbox(images[index], altText));

  // Expose for tests and callers
  gallery.showImage = show;
  gallery.getIndex = () => index;

  return gallery;
}

/**
 * Full-screen image overlay, dismissed by click or Escape.
 * @param {string} url
 * @param {string} altText
 * @returns {HTMLElement}
 */
export function openLightbox(url, altText) {
  const box = document.createElement('div');
  box.className = 'gallery-lightbox';
  box.innerHTML = `
    <button class="gallery-lightbox-close" aria-label="Close image">${icon('close', { size: 24 })}</button>
    <img src="${escapeHtml(url)}" alt="${escapeHtml(altText)}" />
  `;

  const close = () => {
    document.removeEventListener('keydown', onKey);
    box.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  // Close on the backdrop or the close button — not on the photo itself,
  // which a viewer taps to look more closely.
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.closest('.gallery-lightbox-close')) close();
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(box);

  // Expose for callers that need to dismiss it (e.g. on route change).
  box.close = close;

  return box;
}
