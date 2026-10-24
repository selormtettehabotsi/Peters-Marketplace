import { logIn } from '../lib/auth.js';
import { validateLogin, isValid } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, setButtonLoading, readForm, field } from '../lib/form-utils.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { isConfigured } from '../supabase.js';

/**
 * Login page — email + password.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default function renderLogin(params, container) {
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
            <h1 class="auth-title">Welcome back</h1>
            <p class="text-muted">Log in to St. Peter's Marketplace</p>
          </div>

          ${
            !isConfigured
              ? `<p class="form-error" style="text-align:center;margin-bottom:var(--space-4);">
                   Supabase is not configured yet — add your project URL and anon key in <code>src/supabase.js</code>.
                 </p>`
              : ''
          }

          <form id="login-form" novalidate>
            ${field({
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'your@email.com',
              required: true,
              autocomplete: 'email',
            })}
            ${field({
              name: 'password',
              label: 'Password',
              type: 'password',
              placeholder: 'Your password',
              required: true,
              autocomplete: 'current-password',
            })}
            <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit">
              Log In
            </button>
          </form>

          <p class="auth-footer">
            New to SP Market?
            <a href="#/auth/signup" class="auth-switch">Create an account</a>
          </p>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#login-form');
  const submit = container.querySelector('#login-submit');

  // Clear a field's error as soon as the user edits it
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
    const errors = validateLogin(data);
    if (!isValid(errors)) {
      applyErrors(form, errors);
      return;
    }

    const restore = setButtonLoading(submit, 'Logging in…');
    const { error } = await logIn(data.email, data.password);
    restore();

    if (error) {
      showToast(error, 'error');
      return;
    }

    showToast('Welcome back', 'success');
    navigate('/dashboard');
  });
}
