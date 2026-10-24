/**
 * Shared form helpers — inline error display and button loading states.
 * Every form in the app reports problems the same way.
 */

/**
 * Show a validation error under a field and mark the input.
 * @param {HTMLElement} form
 * @param {string} field - the input's id suffix, matching [data-error-for]
 * @param {string} message
 */
export function setFieldError(form, field, message) {
  const input = form.querySelector(`[name="${field}"]`);
  const slot = form.querySelector(`[data-error-for="${field}"]`);
  if (input) {
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');
  }
  if (slot) slot.textContent = message;
}

/** Clear every inline error in a form. */
export function clearFieldErrors(form) {
  form.querySelectorAll('.error').forEach((el) => {
    el.classList.remove('error');
    el.removeAttribute('aria-invalid');
  });
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
  });
}

/**
 * Apply a whole error map produced by src/lib/validation.js.
 * @param {HTMLElement} form
 * @param {Object<string,string>} errors
 * @returns {boolean} true when there was at least one error
 */
export function applyErrors(form, errors) {
  clearFieldErrors(form);
  const fields = Object.keys(errors);
  for (const field of fields) {
    setFieldError(form, field, errors[field]);
  }
  if (fields.length) {
    const first = form.querySelector(`[name="${fields[0]}"]`);
    if (first) first.focus();
  }
  return fields.length > 0;
}

/**
 * Put a button into its loading state, returning a function that restores it.
 * @param {HTMLButtonElement} button
 * @param {string} [loadingLabel]
 * @returns {Function} restore
 */
export function setButtonLoading(button, loadingLabel = 'Please wait…') {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner spinner-sm"></span><span>${loadingLabel}</span>`;
  return () => {
    button.disabled = false;
    button.innerHTML = original;
  };
}

/**
 * Read a form's named fields into a plain object of trimmed strings.
 * @param {HTMLFormElement} form
 * @returns {Object<string,string>}
 */
export function readForm(form) {
  const data = {};
  for (const [key, value] of new FormData(form).entries()) {
    data[key] = typeof value === 'string' ? value.trim() : value;
  }
  return data;
}

/**
 * Markup for one labelled field with an error slot.
 * @param {Object} config
 * @returns {string} HTML
 */
export function field({
  name,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  hint = '',
  autocomplete = '',
  textarea = false,
  options = null,
  value = '',
  maxlength = null,
}) {
  const id = `field-${name}`;
  const attrs = [
    `id="${id}"`,
    `name="${name}"`,
    placeholder ? `placeholder="${placeholder}"` : '',
    required ? 'required' : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
    maxlength ? `maxlength="${maxlength}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  let control;
  if (options) {
    control = `<select class="form-select" ${attrs}>
      ${options
        .map(
          (o) =>
            `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`
        )
        .join('')}
    </select>`;
  } else if (textarea) {
    control = `<textarea class="form-textarea" ${attrs}>${value}</textarea>`;
  } else {
    control = `<input class="form-input" type="${type}" ${attrs} value="${value}" />`;
  }

  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${label}</label>
      ${control}
      ${hint ? `<p class="form-hint">${hint}</p>` : ''}
      <p class="form-error" data-error-for="${name}" role="alert"></p>
    </div>
  `;
}
