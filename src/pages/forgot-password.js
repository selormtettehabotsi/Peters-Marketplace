import { resetPasswordForEmail } from '../lib/auth.js';
import { isValidEmail } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, setButtonLoading, readForm, field } from '../lib/form-utils.js';
import { showToast } from '../components/toast.js';
import { icon } from '../components/icons.js';
import { isConfigured } from '../supabase.js';

/**
 * Forgot password page.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default function renderForgotPassword(params, container) {
  container.innerHTML = `
    <section class="auth-page">
      <figure class="auth-photo">
        <img src="/images/hostel/hostel-building-800.webp" alt="St. Peter's Hostel in Kotei" width="800" height="450" />
        <figcaption>St. Peter's Hostel, Kotei</figcaption>
      </figure>
      <div class="auth-card card">
        <div class="card-body" id="forgot-card-content">
          <div class="auth-header">
            <span class="auth-logo" aria-hidden="true">SP <span>Market</span></span>
            <h1 class="auth-title">Reset password</h1>
            <p class="text-muted">Enter your email and we'll send you a recovery link</p>
          </div>

          ${
            !isConfigured
              ? `<p class="form-error" style="text-align:center;margin-bottom:var(--space-4);">
                   Supabase is not configured yet.
                 </p>`
              : ''
          }

          <form id="forgot-form" novalidate>
            ${field({
              name: 'email',
              label: 'Vendor account email',
              type: 'email',
              placeholder: 'your@email.com',
              required: true,
              autocomplete: 'email',
            })}

            <button type="submit" class="btn btn-primary btn-full btn-lg" id="forgot-submit">
              Send Reset Link
            </button>
          </form>

          <p class="auth-footer">
            Remembered your password?
            <a href="#/auth/login" class="auth-switch">Log in</a>
          </p>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#forgot-form');
  const submit = container.querySelector('#forgot-submit');
  const cardContent = container.querySelector('#forgot-card-content');

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
    const errors = {};
    if (!data.email || !data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      applyErrors(form, errors);
      return;
    }

    const restore = setButtonLoading(submit, 'Sending link…');
    const { success, error } = await resetPasswordForEmail(data.email);
    restore();

    if (error) {
      showToast(error, 'error');
      return;
    }

    // Success state UI
    cardContent.innerHTML = `
      <div class="auth-header" style="text-align: center;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:var(--radius-full); background:var(--color-paper-3); color:var(--color-primary); margin-bottom:var(--space-4);">
          ${icon('mail', { size: 32 })}
        </div>
        <h1 class="auth-title" style="font-size: clamp(2rem, 6vw, 2.6rem);">Check your email</h1>
        <p class="text-muted" style="margin-top:var(--space-2);">
          We sent a password reset link to <strong style="color:var(--color-ink);">${data.email}</strong>
        </p>
      </div>

      <div style="background:var(--color-paper); padding:var(--space-4); border-radius:var(--radius-lg); margin-bottom:var(--space-6); font-size:var(--font-sm); color:var(--color-ink-2); line-height:1.5;">
        Click the link in the email to set a new password. If you don't see the email within a couple of minutes, check your Spam or Junk folder.
      </div>

      <div class="flex flex-col gap-3">
        <button type="button" class="btn btn-secondary btn-full btn-lg" id="resend-reset-btn">
          ${icon('refresh', { size: 16 })} Resend Email
        </button>
        <a href="#/auth/login" class="btn btn-ghost btn-full">
          Back to Log In
        </a>
      </div>
    `;

    const resendBtn = cardContent.querySelector('#resend-reset-btn');
    resendBtn?.addEventListener('click', async () => {
      const restoreResend = setButtonLoading(resendBtn, 'Resending…');
      const res = await resetPasswordForEmail(data.email);
      restoreResend();
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Password reset link resent!', 'success');
      }
    });
  });
}
