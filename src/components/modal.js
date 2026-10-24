import { escapeHtml } from '../lib/format.js';
import { icon } from './icons.js';

/**
 * Open a modal dialog.
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body - HTML string (caller is responsible for escaping)
 * @param {Array<{label: string, className: string, value: *}>} [options.actions]
 * @param {boolean} [options.dismissible] - allow backdrop click / Escape to close
 * @returns {Promise<*>} resolves with the chosen action's value, or null if dismissed
 */
export function showModal({ title, body, actions = [], dismissible = true }) {
  return new Promise((resolve) => {
    const container = document.getElementById('modal-container');
    if (!container) {
      resolve(null);
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button class="btn btn-icon btn-ghost" data-modal-close aria-label="Close dialog">
            ${icon('close')}
          </button>
        </div>
        <div class="modal-body">${body}</div>
        ${
          actions.length
            ? `<div class="modal-footer">
                ${actions
                  .map(
                    (a, i) =>
                      `<button class="btn ${a.className || 'btn-ghost'}" data-action-index="${i}">${escapeHtml(a.label)}</button>`
                  )
                  .join('')}
              </div>`
            : ''
        }
      </div>
    `;

    const close = (value) => {
      document.removeEventListener('keydown', onKeydown);
      backdrop.remove();
      resolve(value);
    };

    const onKeydown = (e) => {
      if (e.key === 'Escape' && dismissible) close(null);
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop && dismissible) {
        close(null);
        return;
      }
      if (e.target.closest('[data-modal-close]')) {
        close(null);
        return;
      }
      const actionBtn = e.target.closest('[data-action-index]');
      if (actionBtn) {
        close(actions[Number(actionBtn.dataset.actionIndex)].value);
      }
    });

    document.addEventListener('keydown', onKeydown);
    container.appendChild(backdrop);

    // Move focus into the dialog for keyboard users
    const firstButton = backdrop.querySelector('.modal-footer .btn, [data-modal-close]');
    if (firstButton) firstButton.focus();
  });
}

/**
 * Confirmation dialog — resolves true when the user confirms.
 * @param {string} title
 * @param {string} message - plain text, escaped here
 * @param {Object} [options] - { confirmLabel, cancelLabel, danger }
 * @returns {Promise<boolean>}
 */
export async function showConfirmModal(title, message, options = {}) {
  const { confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true } = options;

  const result = await showModal({
    title,
    body: `<p>${escapeHtml(message)}</p>`,
    actions: [
      { label: cancelLabel, className: 'btn-ghost', value: false },
      { label: confirmLabel, className: danger ? 'btn-danger' : 'btn-primary', value: true },
    ],
  });

  return result === true;
}
