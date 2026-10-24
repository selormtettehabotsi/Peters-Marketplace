import { CURRENCY } from './constants.js';

/**
 * Format a price in Ghana Cedis with thousands separators. Whole amounts
 * drop the decimals, which are noise on every card:
 * 6400 → "GH₵ 6,400", 1499.5 → "GH₵ 1,499.50".
 * @param {number|string} value
 * @returns {string}
 */
export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${CURRENCY.symbol} 0`;
  const decimals = Number.isInteger(amount) ? 0 : 2;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${CURRENCY.symbol} ${formatted}`;
}

/**
 * Human-readable relative time — e.g. "2h ago", "3 days ago".
 * @param {string|Date} date - ISO timestamp or Date
 * @param {Date} [now] - reference point (injectable for tests)
 * @returns {string}
 */
export function timeAgo(date, now = new Date()) {
  const then = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(then.getTime())) return '';

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Short absolute date — e.g. "22 Oct 2026".
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Initials for the placeholder avatar — "Kwame Mensah" → "KM".
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Escape a string for safe interpolation into an HTML template.
 * Everything that reaches innerHTML must pass through here.
 * @param {*} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Normalise a Ghanaian phone number into wa.me international format.
 * "0244123456" → "233244123456".
 * @param {string} phone
 * @returns {string}
 */
export function toWhatsAppNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  return digits;
}

/**
 * Build the WhatsApp deep link for a product enquiry.
 * @param {string} phone - seller's WhatsApp number
 * @param {string} productTitle
 * @returns {string}
 */
export function buildWhatsAppLink(phone, productTitle) {
  const number = toWhatsAppNumber(phone);
  const text = `Hi, I'm interested in ${productTitle} on St. Peter's Marketplace`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Format a byte count — e.g. 1536 → "1.5 KB".
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
