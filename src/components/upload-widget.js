import { UPLOAD_LIMITS } from '../lib/constants.js';
import { validateImageFile } from '../lib/validation.js';
import { validateVideo } from '../lib/video-utils.js';
import { prepareImage } from '../lib/image-utils.js';
import { formatFileSize, escapeHtml } from '../lib/format.js';
import { icon } from './icons.js';
import { showToast } from './toast.js';

/**
 * Image upload widget: drag-and-drop or browse, previews, drag-to-reorder,
 * per-image removal, and validation against the upload limits.
 *
 * Existing images (when editing) are kept as `{ url, thumbnailUrl }` entries;
 * newly chosen ones as `{ file, preview }`. The caller reads both through
 * getImages() and uploads only the entries that carry a `file`.
 *
 * @param {HTMLElement} mount - element to render into
 * @param {Object} [options] - { existing: Array<{url, thumbnailUrl}> }
 * @returns {Object} widget API
 */
export function createUploadWidget(mount, options = {}) {
  /** @type {Array<{file?: File, preview: string, prepared?: Promise, url?: string, thumbnailUrl?: string}>} */
  const images = (options.existing || []).map((img) => ({
    url: img.url,
    thumbnailUrl: img.thumbnailUrl,
    preview: img.thumbnailUrl || img.url,
  }));

  /** Images that were present at load but have since been removed. */
  const removed = [];

  /** Tail of the background photo-preparation queue. */
  let prepQueue = Promise.resolve();

  mount.innerHTML = `
    <div class="upload-dropzone" id="image-dropzone" tabindex="0" role="button"
         aria-label="Add product images">
      <span class="upload-icon">${icon('image', { size: 24 })}</span>
      <p class="font-semibold" style="margin-bottom:var(--space-1);">
        Drop images here or click to browse
      </p>
      <p class="text-sm text-muted" style="margin:0;">
        Up to ${UPLOAD_LIMITS.MAX_IMAGES} images, ${UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB}MB each ·
        JPEG, PNG or WebP
      </p>
      <input type="file" id="image-input" accept="${UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.join(',')}"
             multiple hidden />
    </div>
    <div class="upload-previews" id="image-previews"></div>
    <p class="form-error" data-error-for="images" role="alert"></p>
  `;

  const dropzone = mount.querySelector('#image-dropzone');
  const input = mount.querySelector('#image-input');
  const previews = mount.querySelector('#image-previews');

  function renderPreviews() {
    previews.innerHTML = images
      .map(
        (img, i) => `
        <div class="upload-preview" data-index="${i}" draggable="true">
          <img src="${escapeHtml(img.preview)}" alt="Product image ${i + 1}" />
          <button type="button" class="remove-btn" data-remove="${i}"
                  aria-label="Remove image ${i + 1}">${icon('close', { size: 12 })}</button>
          ${i === 0 ? '<span class="main-tag">MAIN</span>' : ''}
        </div>
      `
      )
      .join('');
  }

  /** Validate and add newly selected files, respecting the image cap. */
  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const room = UPLOAD_LIMITS.MAX_IMAGES - images.length;
    if (room <= 0) {
      showToast(`Maximum ${UPLOAD_LIMITS.MAX_IMAGES} images`, 'warning');
      return;
    }

    for (const file of files.slice(0, room)) {
      const { valid, error } = validateImageFile(file);
      if (!valid) {
        showToast(`${file.name}: ${error}`, 'error');
        continue;
      }
      // An object URL previews instantly; a data URL of a 5MB photo did not.
      const preview = URL.createObjectURL(file);
      // Start shrinking the photo now, while the seller fills in the form,
      // so Publish only has to upload. A failure here is retried at upload.
      // Queued one at a time: several full-size decodes at once can run a
      // budget phone out of memory.
      const prepared = prepQueue.then(() => prepareImage(file)).catch(() => null);
      prepQueue = prepared;
      images.push({ file, preview, prepared });
    }

    if (files.length > room) {
      showToast(`Only ${room} more image${room === 1 ? '' : 's'} could be added`, 'warning');
    }

    renderPreviews();
  }

  // ---- Browse ----
  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener('change', (e) => {
    addFiles(e.target.files);
    e.target.value = ''; // allow re-selecting the same file
  });

  // ---- Drag & drop from the desktop ----
  ['dragenter', 'dragover'].forEach((type) =>
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((type) =>
    dropzone.addEventListener(type, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  // ---- Remove ----
  previews.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const index = Number(btn.dataset.remove);
    const [gone] = images.splice(index, 1);
    // Remember stored images so the caller can clean up the bucket on save.
    if (gone?.url) removed.push(gone);
    if (gone?.file) URL.revokeObjectURL(gone.preview);
    renderPreviews();
  });

  // ---- Reorder (the first image is the listing's main photo) ----
  let dragIndex = null;

  previews.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.upload-preview');
    if (!card) return;
    dragIndex = Number(card.dataset.index);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  previews.addEventListener('dragend', (e) => {
    e.target.closest('.upload-preview')?.classList.remove('dragging');
  });

  previews.addEventListener('dragover', (e) => e.preventDefault());

  previews.addEventListener('drop', (e) => {
    e.preventDefault();
    const card = e.target.closest('.upload-preview');
    if (!card || dragIndex === null) return;

    const dropIndex = Number(card.dataset.index);
    if (dropIndex === dragIndex) return;

    const [moved] = images.splice(dragIndex, 1);
    images.splice(dropIndex, 0, moved);
    dragIndex = null;
    renderPreviews();
  });

  renderPreviews();

  return {
    /** All images in display order; the first is the listing's main photo. */
    getImages: () => images,
    /** Stored images the user deleted during this edit, for bucket cleanup. */
    getRemoved: () => removed,
  };
}

/**
 * Optional single-video picker with duration/size validation.
 * @param {HTMLElement} mount
 * @param {Object} [options] - { existingUrl, existingDuration }
 * @returns {Object} widget API
 */
export function createVideoWidget(mount, options = {}) {
  /** @type {{file?: File, duration: number, url?: string}|null} */
  let video = options.existingUrl
    ? { url: options.existingUrl, duration: options.existingDuration || 0 }
    : null;

  let removedExisting = false;

  function render() {
    if (!video) {
      mount.innerHTML = `
        <div class="upload-dropzone" id="video-dropzone" tabindex="0" role="button"
             aria-label="Add a product video">
          <span class="upload-icon">${icon('video', { size: 24 })}</span>
          <p class="font-semibold" style="margin-bottom:var(--space-1);">
            Add a short video (optional)
          </p>
          <p class="text-sm text-muted" style="margin:0;">
            MP4 only · max ${UPLOAD_LIMITS.MAX_VIDEO_DURATION_SECONDS} seconds ·
            max ${UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB}MB
          </p>
          <input type="file" id="video-input" accept="video/mp4" hidden />
        </div>
      `;

      const zone = mount.querySelector('#video-dropzone');
      const input = mount.querySelector('#video-input');

      zone.addEventListener('click', () => input.click());
      zone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          input.click();
        }
      });
      ['dragenter', 'dragover'].forEach((t) =>
        zone.addEventListener(t, (e) => {
          e.preventDefault();
          zone.classList.add('dragover');
        })
      );
      ['dragleave', 'drop'].forEach((t) =>
        zone.addEventListener(t, (e) => {
          e.preventDefault();
          zone.classList.remove('dragover');
        })
      );
      zone.addEventListener('drop', (e) => {
        if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
      });
      input.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
        e.target.value = '';
      });
      return;
    }

    const label = video.file
      ? `${video.file.name} · ${formatFileSize(video.file.size)} · ${video.duration}s`
      : `Current video · ${video.duration}s`;

    mount.innerHTML = `
      <div class="card" style="padding: var(--space-4);">
        <div class="flex items-center justify-between gap-4">
          <span class="icon-row text-sm">
            ${icon('video', { size: 18 })} ${escapeHtml(label)}
          </span>
          <button type="button" class="btn btn-ghost btn-sm" data-remove-video
                  style="color: var(--color-danger);">
            ${icon('trash', { size: 14 })} Remove
          </button>
        </div>
      </div>
    `;

    mount.querySelector('[data-remove-video]').addEventListener('click', () => {
      if (video && !video.file) removedExisting = true;
      video = null;
      render();
    });
  }

  async function handleFile(file) {
    const result = await validateVideo(file);
    if (!result.valid) {
      showToast(result.error, 'error');
      return;
    }
    video = { file, duration: result.duration };
    render();
  }

  render();

  return {
    getVideo: () => video,
    /** True when a previously saved video was removed and should be deleted. */
    wasExistingRemoved: () => removedExisting,
  };
}
