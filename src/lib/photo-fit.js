/**
 * Smart photo framing.
 *
 * Sellers upload every shape of photo: portrait and landscape phone shots,
 * squares, tall screenshots, wide panoramas. A frame that always crops
 * ("cover") cuts the item out of odd shapes; one that always letterboxes
 * ("contain") leaves blank bars around ordinary photos.
 *
 * So each frame decides per photo: when the photo's shape is close to the
 * frame's it fills the frame; when it is far off, the whole photo is shown
 * and the empty space is filled with a soft blurred copy of the same photo.
 */

/** Shapes further apart than this ratio get the whole photo shown. */
export const CONTAIN_THRESHOLD = 1.4;

/**
 * Should a photo be shown whole (contain) rather than cropped (cover)?
 * @param {number} photoRatio - photo width / height
 * @param {number} frameRatio - frame width / height
 * @param {number} [threshold]
 * @returns {boolean}
 */
export function shouldContain(photoRatio, frameRatio, threshold = CONTAIN_THRESHOLD) {
  if (!photoRatio || !frameRatio) return false;
  const mismatch = Math.max(photoRatio / frameRatio, frameRatio / photoRatio);
  return mismatch > threshold;
}

/**
 * Fit an <img> inside its `.photo-frame` parent, now and every time its
 * src changes (gallery swipes).
 * @param {HTMLImageElement} img
 * @param {Object} [options]
 * @param {boolean} [options.alwaysContain] - product page: never crop
 * @param {number} [options.frameRatio] - frame width / height. Pass it when
 *   the frame isn't in the page yet (cards are built off-screen); measured
 *   from the frame otherwise.
 */
export function fitPhoto(img, { alwaysContain = false, frameRatio } = {}) {
  const frame = img.closest('.photo-frame');
  if (!frame) return;

  const apply = () => {
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return;
    let contain = alwaysContain;
    if (!contain) {
      let ratio = frameRatio;
      if (!ratio) {
        const box = frame.getBoundingClientRect();
        if (!box.width || !box.height) return;
        ratio = box.width / box.height;
      }
      contain = shouldContain(w / h, ratio);
    }
    frame.classList.toggle('is-contain', contain);
    // The blurred fill behind a letterboxed photo is the photo itself.
    frame.style.setProperty('--photo', `url("${(img.currentSrc || img.src).replace(/"/g, '%22')}")`);
  };

  img.addEventListener('load', apply);
  if (img.complete) apply();
}
