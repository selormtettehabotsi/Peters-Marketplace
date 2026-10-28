import { UPLOAD_LIMITS, CATEGORIES, CONDITIONS } from './constants.js';

/** @returns {boolean} */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Ghanaian numbers are 10 digits locally (0XX XXX XXXX) or 12 with the 233 prefix. */
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** @returns {boolean} */
export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

/**
 * Validate the login form.
 * @returns {Object<string,string>} field → error message (empty object when valid)
 */
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters';

  return errors;
}

/**
 * Validate the reset password form.
 * @returns {Object<string,string>} field → error message
 */
export function validateResetPassword({ password, confirmPassword }) {
  const errors = {};
  if (!password) errors.password = 'Password is required';
  else if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

/**
 * Validate the signup form.
 * @returns {Object<string,string>} field → error message
 */
export function validateSignup({ fullName, email, phone, whatsapp, roomNumber, password, confirmPassword }) {
  const errors = {};

  if (!fullName || !fullName.trim()) errors.fullName = 'Full name is required';
  else if (fullName.trim().length < 2) errors.fullName = 'Enter your full name';

  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!phone || !phone.trim()) errors.phone = 'Phone number is required';
  else if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number (at least 10 digits)';

  // WhatsApp is optional, but must be valid when supplied
  if (whatsapp && whatsapp.trim() && !isValidPhone(whatsapp)) {
    errors.whatsapp = 'Enter a valid WhatsApp number';
  }

  if (!roomNumber || !roomNumber.trim()) errors.roomNumber = 'Room number is required';

  if (!password) errors.password = 'Password is required';
  else if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  return errors;
}

/**
 * Validate the product listing form.
 * @param {Object} data - { title, description, price, category, condition }
 * @param {number} imageCount - how many images are attached
 * @returns {Object<string,string>}
 */
export function validateProduct(data, imageCount) {
  const errors = {};
  const { title, description, price, category, condition } = data;

  if (!title || !title.trim()) errors.title = 'Title is required';
  else if (title.trim().length > 100) errors.title = 'Title must be 100 characters or fewer';

  if (description && description.length > 1000) {
    errors.description = 'Description must be 1000 characters or fewer';
  }

  if (price === '' || price === null || price === undefined) {
    errors.price = 'Price is required';
  } else {
    const n = Number(price);
    if (!Number.isFinite(n)) errors.price = 'Enter a valid price';
    else if (n < 0) errors.price = 'Price cannot be negative';
  }

  if (!category) errors.category = 'Select a category';
  else if (!CATEGORIES.some((c) => c.id === category)) errors.category = 'Select a valid category';

  if (!condition) errors.condition = 'Select a condition';
  else if (!CONDITIONS.some((c) => c.id === condition)) errors.condition = 'Select a valid condition';

  if (!imageCount || imageCount < 1) errors.images = 'Add at least 1 image';
  else if (imageCount > UPLOAD_LIMITS.MAX_IMAGES) {
    errors.images = `Maximum ${UPLOAD_LIMITS.MAX_IMAGES} images allowed`;
  }

  return errors;
}

/**
 * Validate one selected image file against the upload limits.
 * @param {File} file
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected' };

  if (!UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG and WebP images are allowed' };
  }

  if (file.size > UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `Each image must be under ${UPLOAD_LIMITS.MAX_IMAGE_SIZE_MB}MB` };
  }

  return { valid: true, error: null };
}

/**
 * Validate profile update information.
 * @param {Object} data - { fullName, phone, whatsapp, roomNumber }
 * @returns {Object<string,string>} field → error message
 */
export function validateProfileUpdate({ fullName, phone, whatsapp, roomNumber }) {
  const errors = {};

  if (!fullName || !fullName.trim()) errors.fullName = 'Full name is required';
  else if (fullName.trim().length < 2) errors.fullName = 'Enter your full name';

  if (!phone || !phone.trim()) errors.phone = 'Phone number is required';
  else if (!isValidPhone(phone)) errors.phone = 'Enter a valid phone number (at least 10 digits)';

  if (whatsapp && whatsapp.trim() && !isValidPhone(whatsapp)) {
    errors.whatsapp = 'Enter a valid WhatsApp number';
  }

  if (!roomNumber || !roomNumber.trim()) errors.roomNumber = 'Room number is required';

  return errors;
}

/** True when the errors object returned above holds no entries. */
export function isValid(errors) {
  return Object.keys(errors).length === 0;
}

