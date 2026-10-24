import { escapeHtml } from '../lib/format.js';

/**
 * Create a lazy-loading video player for a product clip.
 * `preload="none"` means nothing downloads until the viewer presses play —
 * important on the metered connections most students are using.
 * @param {string} videoUrl
 * @param {string} posterUrl - usually the product's first image
 * @param {number} [duration] - seconds, shown as a badge
 * @returns {HTMLElement}
 */
export function createVideoPlayer(videoUrl, posterUrl, duration) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-player';
  wrapper.id = 'product-video';
  wrapper.innerHTML = `
    <video
      src="${escapeHtml(videoUrl)}"
      ${posterUrl ? `poster="${escapeHtml(posterUrl)}"` : ''}
      controls
      preload="none"
      playsinline
      class="video-element"
    >
      Your browser does not support video playback.
    </video>
    ${duration ? `<span class="video-duration">${Number(duration)}s</span>` : ''}
  `;

  // Hide the duration badge once playback starts so it doesn't sit over controls
  const video = wrapper.querySelector('video');
  const badge = wrapper.querySelector('.video-duration');
  if (badge) {
    video.addEventListener('play', () => badge.classList.add('hidden'), { once: true });
  }

  return wrapper;
}
