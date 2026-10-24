import { UPLOAD_LIMITS } from './constants.js';

const MAX_DURATION = UPLOAD_LIMITS.MAX_VIDEO_DURATION_SECONDS;
const MAX_SIZE_MB = UPLOAD_LIMITS.MAX_VIDEO_SIZE_MB;

/**
 * Check a video's size and type without touching the DOM.
 * Split out from validateVideo so the cheap checks are directly testable.
 * @param {File} file
 * @returns {{valid: boolean, error: string|null}}
 */
export function checkVideoFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Video must be under ${MAX_SIZE_MB}MB` };
  }

  if (!file.type || !file.type.startsWith('video/mp4')) {
    return { valid: false, error: 'Only MP4 videos are allowed' };
  }

  return { valid: true, error: null };
}

/**
 * Validate a video file: size, type, and duration (max 30s).
 * Duration needs a real <video> element, so this half only runs in a browser.
 * @param {File} file - Video file
 * @returns {Promise<{valid: boolean, duration: number, error: string|null}>}
 */
export async function validateVideo(file) {
  const basic = checkVideoFile(file);
  if (!basic.valid) {
    return { valid: false, duration: 0, error: basic.error };
  }

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = Math.round(video.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        resolve({ valid: false, duration: 0, error: 'Could not read video duration' });
        return;
      }

      if (duration > MAX_DURATION) {
        resolve({
          valid: false,
          duration,
          error: `Video must be ${MAX_DURATION} seconds or shorter (yours is ${duration}s)`,
        });
        return;
      }

      resolve({ valid: true, duration, error: null });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, duration: 0, error: 'Could not read video file' });
    };

    video.src = objectUrl;
  });
}
