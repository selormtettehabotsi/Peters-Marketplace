import { updateUserPassword, getUser } from '../lib/auth.js';
import { validateResetPassword, isValid } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, setButtonLoading, readForm, field } from '../lib/form-utils.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { icon } from '../components/icons.js';

/**
 * Reset password page — user lands here after clicking email link.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default function renderResetPassword(params, container) {
  container.innerHTML = `
    <section class="auth-page">
      <figure class="auth-photo">
        <img src="/images/hostel/hostel-building-800.webp" alt="St. Peter's Hostel in Kotei" width="800" height="450" />
        <figcaption>St. Peter's Hostel, Kotei</figcaption>
      </figure>
      <div class="auth-card card">
        <div class="card-body">
          <div class="auth-header">
            <span class="auth-logo" aria-hidden="true">SP <span>Market</span></span>
            <h1 class="auth-title">New password</h1>
            <p class="text-muted">Enter and confirm your new secure password</p>
          </div>

          <form id="reset-password-form" novalidate>
            ${field({
              name: 'password',
              label: 'New password',
              type: 'password',
              placeholder: 'At least 6 characters',
              required: true,
              autocomplete: 'new-password',
            })}

            ${field({
              name: 'confirmPassword',
              label: 'Confirm new password',
              type: 'password',
              placeholder: 'Repeat your new password',
              required: true,
              autocomplete: 'new-password',
            })}

            <button type="submit" class="btn btn-primary btn-full btn-lg" id="reset-submit">
              Update Password
            </button>
          </form>

          <p class="auth-footer">
            <a href="#/auth/login" class="auth-switch">Back to Log In</a>
          </p>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#reset-password-form');
  const submit = container.querySelector('#reset-submit');

  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
      e.target.classList.remove('error');
      e.target.removeAttribute('aria-invalid');
      const slot = form.querySelector(`[data-error-for="${e.target.name}"]`);
      if (slot) slot.textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const data = readForm(form);
    const errors = validateResetPassword(data);
    if (!isValid(errors)) {
      applyErrors(form, errors);
      return;
    }

    const restore = setButtonLoading(submit, 'Updating password…');
    const { success, error } = await updateUserPassword(data.password);
    restore();

    if (error) {
      showToast(error, 'error');
      return;
    }

    showToast('Password updated successfully! Welcome back.', 'success');
    navigate('/dashboard');
  });
}
