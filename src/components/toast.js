import { escapeHtml } from '../lib/format.js';
import { icon } from './icons.js';

const ICONS = {
  success: 'check-circle',
  error: 'alert',
  warning: 'alert',
  info: 'info',
};

/**
 * Show a toast notification in the top-right corner.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type]
 * @param {number} [duration] - ms before auto-dismiss
 * @returns {HTMLElement|null} the toast element
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return null;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="toast-icon toast-icon-${type}">${icon(ICONS[type] || ICONS.info)}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 250);
  };

  const timer = setTimeout(remove, duration);
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });

  return toast;
}
