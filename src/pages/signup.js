import { signUp, logIn } from '../lib/auth.js';
import { validateSignup, isValid } from '../lib/validation.js';
import { applyErrors, clearFieldErrors, setButtonLoading, readForm, field } from '../lib/form-utils.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';
import { icon } from '../components/icons.js';
import { isConfigured } from '../supabase.js';

/** Fields collected on each step; errors are routed back to their step. */
const STEP_FIELDS = {
  1: ['fullName', 'email', 'password'],
  2: ['roomNumber', 'phone', 'whatsapp'],
};

/**
 * Signup page — two short steps: the account itself, then the contact
 * details a buyer needs to reach a seller. The password has a show toggle,
 * so there is no separate "confirm password" field to fill in.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default function renderSignup(params, container) {
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
            <h1 class="auth-title">Create your account</h1>
            <p class="text-muted">Buy and sell with your hostel mates</p>
          </div>

          ${
            !isConfigured
              ? `<p class="form-error" style="text-align:center;margin-bottom:var(--space-4);">
                   Supabase is not configured yet — add your project URL and anon key in <code>src/supabase.js</code>.
                 </p>`
              : ''
          }

          <ol class="stepper" aria-label="Signup progress">
            <li class="stepper-step active" data-stepper="1"><span class="stepper-dot">1</span> Account</li>
            <li class="stepper-line" aria-hidden="true"></li>
            <li class="stepper-step" data-stepper="2"><span class="stepper-dot">2</span> Contact</li>
          </ol>

          <form id="signup-form" novalidate>
            <fieldset class="signup-step" data-step="1">
              <legend class="sr-only">Step 1 of 2: your account</legend>
              ${field({
                name: 'fullName',
                label: 'Full name',
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
              ${field({
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: 'At least 6 characters',
                required: true,
                autocomplete: 'new-password',
              })}
              <button type="button" class="btn btn-primary btn-full btn-lg" id="signup-next">
                Continue ${icon('arrow-right', { size: 18 })}
              </button>
            </fieldset>

            <fieldset class="signup-step" data-step="2" hidden>
              <legend class="sr-only">Step 2 of 2: how buyers reach you</legend>
              <p class="step-intro">Buyers use these to reach you about your listings.</p>
              ${field({
                name: 'roomNumber',
                label: 'Room number',
                placeholder: 'e.g. B204',
                required: true,
              })}
              ${field({
                name: 'phone',
                label: 'Phone number',
                type: 'tel',
                placeholder: '024 123 4567',
                required: true,
                autocomplete: 'tel',
              })}

              <label class="checkbox-row">
                <input type="checkbox" id="whatsapp-same" checked />
                <span>I use this number on WhatsApp</span>
              </label>

              <div id="whatsapp-wrap" hidden>
                ${field({
                  name: 'whatsapp',
                  label: 'WhatsApp number',
                  type: 'tel',
                  placeholder: '024 123 4567',
                  autocomplete: 'tel',
                })}
              </div>

              <div class="step-actions">
                <button type="button" class="btn btn-secondary btn-lg" id="signup-back">
                  ${icon('arrow-left', { size: 18 })} Back
                </button>
                <button type="submit" class="btn btn-primary btn-lg" id="signup-submit">
                  Create account
                </button>
              </div>
            </fieldset>
          </form>

          <p class="auth-footer">
            Already have an account?
            <a href="#/auth/login" class="auth-switch">Log in</a>
          </p>
        </div>
      </div>
    </section>
  `;

  const form = container.querySelector('#signup-form');
  const submit = container.querySelector('#signup-submit');
  const sameWhatsapp = container.querySelector('#whatsapp-same');
  const whatsappWrap = container.querySelector('#whatsapp-wrap');

  function showStep(step) {
    form.querySelectorAll('.signup-step').forEach((fs) => {
      fs.hidden = Number(fs.dataset.step) !== step;
    });
    container.querySelectorAll('[data-stepper]').forEach((el) => {
      const n = Number(el.dataset.stepper);
      el.classList.toggle('active', n === step);
      el.classList.toggle('done', n < step);
    });
    form.querySelector(`[data-step="${step}"] input`)?.focus();
  }

  /** Form data with the fields this design no longer asks for filled in. */
  function readSignup() {
    const data = readForm(form);
    data.confirmPassword = data.password;
    if (sameWhatsapp.checked) data.whatsapp = '';
    return data;
  }

  /** Only the errors that belong to the given step. */
  function errorsFor(step, errors) {
    return Object.fromEntries(
      Object.entries(errors).filter(([name]) => STEP_FIELDS[step].includes(name))
    );
  }

  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('error')) {
      e.target.classList.remove('error');
      e.target.removeAttribute('aria-invalid');
      const slot = form.querySelector(`[data-error-for="${e.target.name}"]`);
      if (slot) slot.textContent = '';
    }
  });

  sameWhatsapp.addEventListener('change', () => {
    whatsappWrap.hidden = sameWhatsapp.checked;
    if (!sameWhatsapp.checked) whatsappWrap.querySelector('input').focus();
  });

  container.querySelector('#signup-next').addEventListener('click', () => {
    clearFieldErrors(form);
    const stepErrors = errorsFor(1, validateSignup(readSignup()));
    if (!isValid(stepErrors)) {
      applyErrors(form, stepErrors);
      return;
    }
    showStep(2);
  });

  container.querySelector('#signup-back').addEventListener('click', () => showStep(1));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const data = readSignup();
    const errors = validateSignup(data);
    if (!isValid(errors)) {
      // Send the user back to step 1 if anything there needs fixing.
      const first = isValid(errorsFor(1, errors)) ? 2 : 1;
      showStep(first);
      applyErrors(form, errorsFor(first, errors));
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
