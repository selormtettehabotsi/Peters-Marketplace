import { CATEGORIES, CONDITIONS } from '../lib/constants.js';
import { getUser, isBanned } from '../lib/auth.js';
import { createProduct, updateProduct, fetchProduct } from '../lib/api.js';
import {
  uploadProductImages,
  uploadProductVideo,
  deleteSingleImage,
  deleteSingleVideo,
} from '../lib/storage.js';
import { validateProduct, isValid } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, readForm, field } from '../lib/form-utils.js';
import { createUploadWidget, createVideoWidget } from '../components/upload-widget.js';
import { navigate, watchNavigation } from '../router.js';
import { showToast } from '../components/toast.js';
import { icon } from '../components/icons.js';
import { escapeHtml } from '../lib/format.js';

/**
 * Shared create/edit listing form.
 * @param {Object} config - { mode: 'new'|'edit', product?: Object }
 * @param {HTMLElement} container
 */
async function renderForm({ mode, product }, container) {
  const isEdit = mode === 'edit';
  const user = getUser();

  container.innerHTML = `
    <div class="container section-sm" style="max-width: 760px;">
      <a href="#/dashboard" class="back-link">
        ${icon('arrow-left', { size: 16 })} Back to Dashboard
      </a>

      <div class="page-header">
        <h1 class="page-title">${isEdit ? 'Edit Listing' : 'Create New Listing'}</h1>
        <p class="page-subtitle">
          ${isEdit ? 'Update the details of your product' : 'Add your product to the marketplace'}
        </p>
      </div>

      <form id="listing-form" class="listing-form" novalidate>
        <section class="form-card" aria-labelledby="photos-heading">
          <h2 class="form-card-title" id="photos-heading">Photos</h2>
          <p class="form-card-hint">The first photo is the cover. Drag to reorder.</p>
          <div id="image-widget"></div>
          <div id="video-widget" class="mt-4"></div>
        </section>

        <section class="form-card" aria-labelledby="details-heading">
          <h2 class="form-card-title" id="details-heading">Details</h2>

          ${field({
            name: 'title',
            label: 'Title',
            placeholder: 'e.g. HP Pavilion Laptop, 8GB RAM',
            required: true,
            maxlength: 100,
            value: escapeHtml(product?.title || ''),
          })}

          ${field({
            name: 'description',
            label: 'Description',
            placeholder: 'Describe the condition, specs, and anything a buyer should know.',
            textarea: true,
            maxlength: 1000,
            value: escapeHtml(product?.description || ''),
          })}
        </section>

        <section class="form-card" aria-labelledby="price-heading">
          <h2 class="form-card-title" id="price-heading">Price &amp; condition</h2>
          <div class="form-row">
            ${field({
              name: 'price',
              label: 'Price (GH₵)',
              type: 'number',
              placeholder: '0.00',
              required: true,
              value: product?.price ?? '',
            })}
            ${field({
              name: 'category',
              label: 'Category',
              required: true,
              value: product?.category || '',
              options: [
                { value: '', label: 'Select category' },
                ...CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
              ],
            })}
          </div>

          ${field({
            name: 'condition',
            label: 'Condition',
            required: true,
            value: product?.condition || '',
            options: [
              { value: '', label: 'Select condition' },
              ...CONDITIONS.map((c) => ({ value: c.id, label: c.name })),
            ],
          })}

        </section>

        <div class="upload-progress hidden" id="submit-progress">
          <div class="upload-progress-fill" id="submit-progress-fill"></div>
        </div>
        <p class="text-sm text-muted hidden" id="submit-status" aria-live="polite"></p>

        <div class="form-actions">
          <a href="#/dashboard" class="btn btn-ghost btn-lg">Cancel</a>
          <button type="submit" class="btn btn-primary btn-lg" id="listing-submit">
            ${isEdit ? 'Save Changes' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  `;

  // Existing media is passed to the widgets when editing
  const existingImages = (product?.image_urls || []).map((url, i) => ({
    url,
    thumbnailUrl: product?.thumbnail_urls?.[i],
  }));

  const imageWidget = createUploadWidget(container.querySelector('#image-widget'), {
    existing: existingImages,
  });

  const videoWidget = createVideoWidget(container.querySelector('#video-widget'), {
    existingUrl: product?.video_url,
    existingDuration: product?.video_duration,
  });

  const form = container.querySelector('#listing-form');
  const submit = container.querySelector('#listing-submit');
  const progress = container.querySelector('#submit-progress');
  const progressFill = container.querySelector('#submit-progress-fill');
  const statusText = container.querySelector('#submit-status');

  function setProgress(percent, message) {
    progress.classList.remove('hidden');
    statusText.classList.remove('hidden');
    progressFill.style.width = `${percent}%`;
    statusText.textContent = message;
  }

  function hideProgress() {
    progress.classList.add('hidden');
    statusText.classList.add('hidden');
    progressFill.style.width = '0%';
  }

  form.addEventListener('input', (e) => {
    if (e.target.classList?.contains('error')) {
      e.target.classList.remove('error');
      e.target.removeAttribute('aria-invalid');
      const slot = form.querySelector(`[data-error-for="${e.target.name}"]`);
      if (slot) slot.textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const data = readForm(form);
    const images = imageWidget.getImages();
    const errors = validateProduct(data, images.length);

    if (!isValid(errors)) {
      applyErrors(form, errors);
      if (errors.images) showToast(errors.images, 'error');
      return;
    }

    if (isBanned()) {
      showToast('Your account is suspended and cannot create listings', 'error');
      return;
    }

    submit.disabled = true;
    const originalLabel = submit.innerHTML;
    submit.innerHTML = '<span class="spinner spinner-sm"></span><span>Publishing…</span>';

    try {
      const productId = isEdit ? product.id : crypto.randomUUID();

      // ---- 1 + 2. Upload photos and video, all at the same time ----
      // Photos already in storage keep their URLs; only new files upload.
      // Most photos were already shrunk in the background when picked.
      const newImages = images.filter((img) => img.file);
      const video = videoWidget.getVideo();
      const uploadingVideo = Boolean(video?.file);
      const totalFiles = newImages.length + (uploadingVideo ? 1 : 0);
      let doneFiles = 0;

      const reportProgress = () => {
        const pct = totalFiles ? Math.round((doneFiles / totalFiles) * 90) : 90;
        const label = totalFiles
          ? `Uploading ${Math.min(doneFiles + 1, totalFiles)} of ${totalFiles}…`
          : 'Saving…';
        setProgress(pct, label);
      };
      const fileDone = () => {
        doneFiles += 1;
        reportProgress();
      };
      reportProgress();

      const [uploaded, videoUrl] = await Promise.all([
        uploadProductImages(newImages, user.id, productId, fileDone),
        uploadingVideo
          ? uploadProductVideo(video.file, user.id, productId).then((url) => {
              fileDone();
              return url;
            })
          : Promise.resolve(video?.url || null),
      ]);
      const videoDuration = video ? video.duration || null : null;

      // Rebuild the list in the seller's chosen order, first photo = cover.
      const imageUrls = [];
      const thumbnailUrls = [];
      let nextNew = 0;
      for (const img of images) {
        if (img.file) {
          const { imageUrl, thumbnailUrl } = uploaded[nextNew++];
          imageUrls.push(imageUrl);
          thumbnailUrls.push(thumbnailUrl);
        } else {
          imageUrls.push(img.url);
          thumbnailUrls.push(img.thumbnailUrl || img.url);
        }
      }

      // ---- 3. Write the row ----
      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        price: parseFloat(data.price),
        category: data.category,
        condition: data.condition,
        image_urls: imageUrls,
        thumbnail_urls: thumbnailUrls,
        video_url: videoUrl,
        video_duration: videoDuration,
      };

      setProgress(95, 'Saving…');

      const { error } = isEdit
        ? await updateProduct(product.id, user.id, payload)
        : await createProduct({ id: productId, seller_id: user.id, ...payload });

      if (error) throw new Error(error);

      // ---- 4. Clean up media the user removed while editing ----
      // Only after the row is saved, so a failed save leaves the files intact.
      await Promise.all([
        ...imageWidget.getRemoved().map((gone) => deleteSingleImage(gone.url, gone.thumbnailUrl)),
        videoWidget.wasExistingRemoved() && product?.video_url
          ? deleteSingleVideo(product.video_url)
          : null,
      ]);

      setProgress(100, 'Done');
      showToast(isEdit ? 'Listing updated' : 'Listing published', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Listing save failed:', error);
      hideProgress();
      submit.disabled = false;
      submit.innerHTML = originalLabel;
      showToast(error.message || 'Could not save the listing', 'error');
    }
  });
}

/**
 * New listing page.
 */
export async function renderNewListing(params, container) {
  await renderForm({ mode: 'new' }, container);
}

/**
 * Edit listing page — loads the product and verifies ownership first.
 */
export async function renderEditListing(params, container) {
  const user = getUser();
  const isStale = watchNavigation();

  container.innerHTML = `
    <div class="container section-sm">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-image" style="max-width:400px;"></div>
    </div>
  `;

  const { product, error } = await fetchProduct(params.id);
  if (isStale()) return;

  if (error || !product) {
    container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <div class="empty-icon">${icon('search', { size: 32 })}</div>
          <div class="empty-title">Listing Not Found</div>
          <div class="empty-description">This listing may have been removed.</div>
          <a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a>
        </div>
      </div>
    `;
    return;
  }

  // RLS enforces this server-side too; this is the friendly client-side check.
  if (product.seller_id !== user?.id) {
    showToast('You can only edit your own listings', 'error');
    navigate('/dashboard');
    return;
  }

  await renderForm({ mode: 'edit', product }, container);
}
