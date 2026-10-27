import { supabase } from '../supabase.js';
import { prepareImage, prepareAvatar } from './image-utils.js';
import { UPLOAD_LIMITS } from './constants.js';

const IMAGE_BUCKET = 'product-images';
const VIDEO_BUCKET = 'product-videos';
const AVATAR_BUCKET = 'avatars';

/**
 * Recover the in-bucket object path from a Supabase public URL.
 * ".../object/public/product-images/<uid>/<pid>/image_0.webp"
 *   → "<uid>/<pid>/image_0.webp"
 * @param {string} url
 * @param {string} bucket
 * @returns {string|null} null when the URL does not belong to this bucket
 */
export function extractPathFromUrl(url, bucket) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/object/public/${bucket}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const path = url.slice(at + marker.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * Upload a product image and its thumbnail to Supabase Storage.
 *
 * Filenames carry a random token rather than the image's position in the
 * list. When a seller removes one photo and adds another, the new upload
 * would otherwise take the index of a photo they kept and overwrite it.
 *
 * @param {File} file - Image file
 * @param {string} userId - Seller's user ID
 * @param {string} productId - Product ID
 * @param {Promise|Object} [prepared] - result (or pending result) of
 *   prepareImage(file), started when the photo was picked; prepared here
 *   if absent
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>}
 */
export async function uploadProductImage(file, userId, productId, prepared) {
  const { full, thumb } = (await prepared) || (await prepareImage(file));

  const token = crypto.randomUUID().slice(0, 8);
  const imagePath = `${userId}/${productId}/image_${token}.webp`;
  const thumbPath = `${userId}/${productId}/thumb_${token}.webp`;
  const bucket = supabase.storage.from(IMAGE_BUCKET);

  // Photo and thumbnail go up together rather than one after the other.
  const results = await Promise.all([
    bucket.upload(imagePath, full, { contentType: 'image/webp', upsert: true }),
    bucket.upload(thumbPath, thumb, { contentType: 'image/webp', upsert: true }),
  ]);
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;

  return {
    imageUrl: bucket.getPublicUrl(imagePath).data.publicUrl,
    thumbnailUrl: bucket.getPublicUrl(thumbPath).data.publicUrl,
  };
}

/**
 * Run async jobs with at most `limit` in flight, keeping results in order.
 * @template T
 * @param {Array<() => Promise<T>>} jobs
 * @param {number} limit
 * @returns {Promise<T[]>}
 */
export async function runLimited(jobs, limit) {
  const results = new Array(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const i = next++;
      results[i] = await jobs[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, worker));
  return results;
}

/**
 * Upload every new photo of a listing, several at a time.
 * @param {Array<{file: File, prepared?: Promise}>} images - new images only
 * @param {string} userId
 * @param {string} productId
 * @param {Function} [onEach] - called after each photo finishes
 * @returns {Promise<Array<{imageUrl: string, thumbnailUrl: string}>>} in input order
 */
export function uploadProductImages(images, userId, productId, onEach = () => {}) {
  const jobs = images.map((img) => async () => {
    const result = await uploadProductImage(img.file, userId, productId, img.prepared);
    onEach();
    return result;
  });
  return runLimited(jobs, UPLOAD_LIMITS.UPLOAD_CONCURRENCY);
}

/**
 * Upload a product video.
 * @param {File} file - Video file (MP4, max 10MB, max 30s)
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<string>} Video public URL
 */
export async function uploadProductVideo(file, userId, productId) {
  const videoPath = `${userId}/${productId}/video.mp4`;

  const { error } = await supabase.storage
    .from(VIDEO_BUCKET)
    .upload(videoPath, file, { contentType: 'video/mp4', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath);
  return data.publicUrl;
}

/**
 * Remove a product's stored images and video.
 * Best-effort: a storage failure must not stop the row from being deleted,
 * or the listing would be undeletable.
 * @param {Object} product - needs image_urls, thumbnail_urls, video_url
 */
export async function deleteProductMedia(product) {
  if (!product) return;

  const imagePaths = [...(product.image_urls || []), ...(product.thumbnail_urls || [])]
    .map((url) => extractPathFromUrl(url, IMAGE_BUCKET))
    .filter(Boolean);

  if (imagePaths.length) {
    try {
      await supabase.storage.from(IMAGE_BUCKET).remove(imagePaths);
    } catch (error) {
      console.warn('Could not remove product images:', error.message);
    }
  }

  const videoPath = extractPathFromUrl(product.video_url, VIDEO_BUCKET);
  if (videoPath) {
    try {
      await supabase.storage.from(VIDEO_BUCKET).remove([videoPath]);
    } catch (error) {
      console.warn('Could not remove product video:', error.message);
    }
  }
}

/**
 * Remove a product's video during an edit.
 * @param {string} videoUrl
 */
export async function deleteSingleVideo(videoUrl) {
  const path = extractPathFromUrl(videoUrl, VIDEO_BUCKET);
  if (!path) return;

  try {
    await supabase.storage.from(VIDEO_BUCKET).remove([path]);
  } catch (error) {
    console.warn('Could not remove video:', error.message);
  }
}

/**
 * Remove one image (and its thumbnail) during an edit.
 * @param {string} imageUrl
 * @param {string} [thumbnailUrl]
 */
export async function deleteSingleImage(imageUrl, thumbnailUrl) {
  const paths = [
    extractPathFromUrl(imageUrl, IMAGE_BUCKET),
    extractPathFromUrl(thumbnailUrl, IMAGE_BUCKET),
  ].filter(Boolean);

  if (!paths.length) return;

  try {
    await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  } catch (error) {
    console.warn('Could not remove image:', error.message);
  }
}

/**
 * Upload a vendor profile picture to Supabase Storage.
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<string>} public URL of uploaded avatar
 */
export async function uploadAvatar(file, userId) {
  const prepared = await prepareAvatar(file, 400);
  const token = Date.now().toString(36);
  const avatarPath = `${userId}/avatar_${token}.webp`;
  const bucket = supabase.storage.from(AVATAR_BUCKET);

  const { error } = await bucket.upload(avatarPath, prepared, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (error) throw error;

  return bucket.getPublicUrl(avatarPath).data.publicUrl;
}

/**
 * Remove an avatar from storage.
 * @param {string} avatarUrl
 */
export async function deleteAvatar(avatarUrl) {
  const path = extractPathFromUrl(avatarUrl, AVATAR_BUCKET);
  if (!path) return;

  try {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  } catch (error) {
    console.warn('Could not remove avatar:', error.message);
  }
}
