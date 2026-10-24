import { supabase } from '../supabase.js';
import { compressImage, generateThumbnail } from './image-utils.js';

const IMAGE_BUCKET = 'product-images';
const VIDEO_BUCKET = 'product-videos';

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
 * Upload a product image to Supabase Storage.
 * Compresses the image and generates a thumbnail.
 *
 * Filenames carry a random token rather than the image's position in the
 * list. When a seller removes one photo and adds another, the new upload
 * would otherwise take the index of a photo they kept and overwrite it.
 *
 * @param {File} file - Image file
 * @param {string} userId - Seller's user ID
 * @param {string} productId - Product ID
 * @returns {Promise<{imageUrl: string, thumbnailUrl: string}>}
 */
export async function uploadProductImage(file, userId, productId) {
  const compressed = await compressImage(file);
  const thumbnail = await generateThumbnail(file);

  const token = crypto.randomUUID().slice(0, 8);
  const imagePath = `${userId}/${productId}/image_${token}.webp`;
  const thumbPath = `${userId}/${productId}/thumb_${token}.webp`;

  const { error: imgErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(imagePath, compressed, { contentType: 'image/webp', upsert: true });
  if (imgErr) throw imgErr;

  const { error: thumbErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(thumbPath, thumbnail, { contentType: 'image/webp', upsert: true });
  if (thumbErr) throw thumbErr;

  const { data: imgData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath);
  const { data: thumbData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(thumbPath);

  return {
    imageUrl: imgData.publicUrl,
    thumbnailUrl: thumbData.publicUrl,
  };
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
