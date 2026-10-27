import { UPLOAD_LIMITS } from './constants.js';

/**
 * Work out the output dimensions for a resize that preserves aspect ratio
 * and never upscales.
 * @param {number} width
 * @param {number} height
 * @param {number} maxWidth
 * @returns {{width: number, height: number}}
 */
export function scaleDimensions(width, height, maxWidth) {
  if (!width || !height) return { width: 0, height: 0 };
  if (width <= maxWidth) return { width: Math.round(width), height: Math.round(height) };
  return {
    width: maxWidth,
    height: Math.round((height / width) * maxWidth),
  };
}

/**
 * Scale so the image's longer side is at most `max` (never upscales).
 * Capping the long edge treats portrait phone photos the same as landscape
 * ones; capping only the width let a portrait photo stay very tall.
 * @param {number} width
 * @param {number} height
 * @param {number} max
 * @returns {{width: number, height: number}}
 */
export function fitLongEdge(width, height, max) {
  if (!width || !height) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Scale so the image's shorter side is at most `min` (never upscales).
 * Used for thumbnails: cards crop to a near-square box, so the short side
 * is what has to stay sharp.
 * @param {number} width
 * @param {number} height
 * @param {number} min
 * @returns {{width: number, height: number}}
 */
export function fitShortEdge(width, height, min) {
  if (!width || !height) return { width: 0, height: 0 };
  const scale = Math.min(1, min / Math.min(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Decode an image file once. createImageBitmap decodes off the main thread
 * in modern browsers and applies the photo's EXIF rotation; older browsers
 * fall back to an <img> element.
 * @param {File|Blob} file
 * @returns {Promise<{source: CanvasImageSource, width: number, height: number, close: Function}>}
 */
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // fall through to <img>, e.g. formats the bitmap decoder rejects
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read image file'));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draw `source` into a new canvas of the given size. */
function drawToCanvas(source, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

/** Per-channel difference still counted as "the same plain background". */
const BORDER_TOLERANCE = 28;

/**
 * Find the box around the actual subject when a photo has a plain,
 * even-coloured border (an item snapped on a bed sheet or white table,
 * a cut-out PNG). Pure: works on raw RGBA pixels so it can be unit-tested.
 * @param {Uint8ClampedArray} data - RGBA pixels, row by row
 * @param {number} width
 * @param {number} height
 * @returns {{x: number, y: number, width: number, height: number}|null}
 *   the subject's box, or null when there is no plain border worth trimming
 */
export function findContentBox(data, width, height) {
  if (!width || !height) return null;
  const px = (x, y) => (y * width + x) * 4;

  // The background is whatever all four corners agree on.
  const corners = [px(0, 0), px(width - 1, 0), px(0, height - 1), px(width - 1, height - 1)];
  const ref = corners[0];
  const same = (i, j) => {
    // Two fully transparent pixels match whatever their RGB says
    if (data[i + 3] < 16 && data[j + 3] < 16) return true;
    return (
      Math.abs(data[i] - data[j]) <= BORDER_TOLERANCE &&
      Math.abs(data[i + 1] - data[j + 1]) <= BORDER_TOLERANCE &&
      Math.abs(data[i + 2] - data[j + 2]) <= BORDER_TOLERANCE &&
      Math.abs(data[i + 3] - data[j + 3]) <= BORDER_TOLERANCE
    );
  };
  if (!corners.every((c) => same(c, ref))) return null; // busy background: leave it

  const rowPlain = (y) => { for (let x = 0; x < width; x++) if (!same(px(x, y), ref)) return false; return true; };
  const colPlain = (x, y0, y1) => { for (let y = y0; y <= y1; y++) if (!same(px(x, y), ref)) return false; return true; };

  let top = 0;
  while (top < height && rowPlain(top)) top++;
  if (top === height) return null; // the whole photo is one colour
  let bottom = height - 1;
  while (bottom > top && rowPlain(bottom)) bottom--;
  let left = 0;
  while (left < width && colPlain(left, top, bottom)) left++;
  let right = width - 1;
  while (right > left && colPlain(right, top, bottom)) right--;

  const box = { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  // Only worth it when the plain margin is substantial
  if (box.width * box.height > width * height * 0.8) return null;
  return box;
}

/**
 * The region of a photo worth keeping: the subject plus a little breathing
 * room when the photo has a plain border, otherwise the whole photo.
 * Analysis runs on a small copy, so it's quick even for 12MP photos.
 * @param {CanvasImageSource} source
 * @param {number} width - source width
 * @param {number} height - source height
 * @returns {{x: number, y: number, width: number, height: number}}
 */
function findTrimRect(source, width, height) {
  const whole = { x: 0, y: 0, width, height };
  const scale = Math.min(1, 256 / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale));
  const sh = Math.max(1, Math.round(height * scale));
  let box;
  try {
    const { data } = drawToCanvas(source, sw, sh).getContext('2d').getImageData(0, 0, sw, sh);
    box = findContentBox(data, sw, sh);
  } catch {
    return whole; // pixels unreadable: keep the photo as it is
  }
  if (!box) return whole;

  // Back to source pixels, plus 8% padding of the subject's longer side
  const pad = Math.round(Math.max(box.width, box.height) * 0.08);
  const x0 = Math.max(0, Math.floor((box.x - pad) / scale));
  const y0 = Math.max(0, Math.floor((box.y - pad) / scale));
  const x1 = Math.min(width, Math.ceil((box.x + box.width + pad) / scale));
  const y1 = Math.min(height, Math.ceil((box.y + box.height + pad) / scale));
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** canvas.toBlob as a promise; null means the browser can't encode WebP. */
function encodeWebp(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
}

/**
 * Turn one picked photo into the two files a listing needs, decoding it
 * only once. A plain, even-coloured border around the item is trimmed off.
 *  - full:  long edge capped at FULL_LONG_EDGE, for the product page
 *  - thumb: short edge capped at THUMB_SHORT_EDGE (long edge at
 *           THUMB_LONG_EDGE), for cards; drawn from
 *           the already-shrunk full canvas, not the 12MP original
 * Both are WebP and encoded in parallel.
 * @param {File|Blob} file
 * @returns {Promise<{full: Blob, thumb: Blob, width: number, height: number}>}
 */
export async function prepareImage(file) {
  const decoded = await decodeImage(file);
  try {
    // Trim a plain border first, so the item fills the frame at full detail
    const crop = findTrimRect(decoded.source, decoded.width, decoded.height);
    const fullSize = fitLongEdge(crop.width, crop.height, UPLOAD_LIMITS.FULL_LONG_EDGE);
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullSize.width;
    fullCanvas.height = fullSize.height;
    const ctx = fullCanvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, crop.x, crop.y, crop.width, crop.height, 0, 0, fullSize.width, fullSize.height);

    const byShort = fitShortEdge(fullSize.width, fullSize.height, UPLOAD_LIMITS.THUMB_SHORT_EDGE);
    const thumbSize = fitLongEdge(byShort.width, byShort.height, UPLOAD_LIMITS.THUMB_LONG_EDGE);
    const thumbCanvas = drawToCanvas(fullCanvas, thumbSize.width, thumbSize.height);

    const [full, thumb] = await Promise.all([
      encodeWebp(fullCanvas, UPLOAD_LIMITS.FULL_QUALITY),
      encodeWebp(thumbCanvas, UPLOAD_LIMITS.THUMB_QUALITY),
    ]);

    // A browser without WebP encoding returns null — fall back to the original.
    return {
      full: full || file,
      thumb: thumb || full || file,
      width: fullSize.width,
      height: fullSize.height,
    };
  } finally {
    decoded.close();
  }
}

/**
 * Center-crop and scale an image for an avatar (square, WebP).
 * @param {File|Blob} file
 * @param {number} [size=400]
 * @returns {Promise<Blob>}
 */
export async function prepareAvatar(file, size = 400) {
  try {
    const decoded = await decodeImage(file);
    try {
      const minSide = Math.min(decoded.width, decoded.height);
      const cropX = Math.round((decoded.width - minSide) / 2);
      const cropY = Math.round((decoded.height - minSide) / 2);

      const targetSize = Math.min(size, minSide);
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(decoded.source, cropX, cropY, minSide, minSide, 0, 0, targetSize, targetSize);

      const blob = await encodeWebp(canvas, 0.85);
      return blob || file;
    } finally {
      if (typeof decoded.close === 'function') decoded.close();
    }
  } catch {
    return file;
  }
}

/**
 * Compress and resize a single image (long edge capped, WebP).
 * @param {File|Blob} file
 * @returns {Promise<Blob>}
 */
export async function compressImage(file) {
  return (await prepareImage(file)).full;
}

/**
 * Read a file as a data URL.
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
