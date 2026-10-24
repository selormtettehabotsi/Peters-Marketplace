import { signUp, logIn } from '../lib/auth.js';
import { validateSignup, isValid } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, setButtonLoading, readForm, field } from '../lib/form-utils.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { icon } from '../components/icons.js';
import { isConfigured } from '../supabase.js';

/**
 * Signup page — collects the contact details a buyer needs to reach a seller.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default function renderSignup(params, container) {
  container.innerHTML = `
    <section class="auth-page">
      <div class="auth-card card" style="max-width: 520px;">
        <div class="card-body">
          <div class="auth-header">
            <span class="auth-logo">${icon('store', { size: 32 })}</span>
            <h2>Join the Marketplace</h2>
            <p class="text-muted">Start buying and selling at St. Peter's Hostel</p>
          </div>

          ${
            !isConfigured
              ? `<p class="form-error" style="text-align:center;margin-bottom:var(--space-4);">
                   Supabase is not configured yet — add your project URL and anon key in <code>src/supabase.js</code>.
                 </p>`
              : ''
          }

          <form id="signup-form" novalidate>
            ${field({
              name: 'fullName',
              label: 'Full Name',
              placeholder: 'Kwame Mensah',
              required: true,
              autocomplete: 'name',
            })}
            ${field({
              name: 'email',
              label: 'Email',
              type: 'email',
              placeholder: 'your@email.com',
              required: true,
              autocomplete: 'email',
            })}

            <div class="form-row">
              ${field({
                name: 'phone',
                label: 'Phone Number',
                type: 'tel',
                placeholder: '0XX XXX XXXX',
                required: true,
                autocomplete: 'tel',
              })}
              ${field({
                name: 'whatsapp',
                label: 'WhatsApp Number',
                type: 'tel',
                placeholder: 'Same as phone if empty',
                autocomplete: 'tel',
              })}
            </div>

            ${field({
              name: 'roomNumber',
              label: 'Room Number',
              placeholder: 'e.g. B204',
              required: true,
            })}

            <div class="form-row">
              ${field({
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: '••••••••',
                required: true,
                autocomplete: 'new-password',
                hint: 'At least 6 characters',
              })}
              ${field({
                name: 'confirmPassword',
                label: 'Confirm Password',
                type: 'password',
                placeholder: '••••••••',
                required: true,
                autocomplete: 'new-password',
              })}
            </div>

            <button type="submit" class="btn btn-primary btn-full btn-lg" id="signup-submit">
              Create Account
            </button>
          </form>

          <p class="auth-footer">
            Already have an account?
            <a href="#/auth/login" class="text-primary font-semibold">Log In</a>
          </p>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#signup-form');
  const submit = container.querySelector('#signup-submit');

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
    const errors = validateSignup(data);
    if (!isValid(errors)) {
      applyErrors(form, errors);
      return;
    }

    const restore = setButtonLoading(submit, 'Creating account…');

    const { error } = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      whatsapp: data.whatsapp, // signUp() falls back to phone when blank
      roomNumber: data.roomNumber,
    });

    if (error) {
      restore();
      showToast(error, 'error');
      return;
    }

    // With email confirmation disabled, signUp returns a session; when it is
    // enabled Supabase does not, so log in explicitly to cover both setups.
    const loginRes = await logIn(data.email, data.password);
    restore();

    if (loginRes?.error && loginRes.error.toLowerCase().includes('confirm')) {
      showToast('Account created! Please check your email to confirm before logging in.', 'info');
      navigate('/auth/login');
      return;
    }

    showToast('Account created! Start selling', 'success');
    navigate('/dashboard');
  });
}
