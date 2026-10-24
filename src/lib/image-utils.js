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
 * Compress and resize an image file before upload.
 * Converts to WebP and caps the width, which typically cuts a 3MB phone
 * photo to well under 200KB.
 * @param {File|Blob} file - Original image file
 * @param {number} [maxWidth] - Max width in pixels
 * @param {number} [quality] - WebP quality 0-1
 * @returns {Promise<Blob>} Compressed image blob
 */
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const { width, height } = scaleDimensions(img.width, img.height, maxWidth);
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // A browser without WebP encoding returns null — fall back to the original.
          resolve(blob || file);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image file'));
    };

    img.src = objectUrl;
  });
}

/**
 * Generate a small thumbnail used for grid cards and the blur-up effect.
 * @param {File|Blob} file
 * @returns {Promise<Blob>}
 */
export function generateThumbnail(file) {
  return compressImage(file, UPLOAD_LIMITS.THUMBNAIL_WIDTH, UPLOAD_LIMITS.THUMBNAIL_QUALITY);
}

/**
 * Read a file as a data URL — used for instant local previews.
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
