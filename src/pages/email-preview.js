import { icon } from '../components/icons.js';
import { showToast } from '../components/toast.js';

const VERIFICATION_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your St. Peter's Marketplace account</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F3F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181B; }
    .email-container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E4E0D7; }
    .btn-cta { display: inline-block; background-color: #991B1B; color: #FFFFFF !important; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(153, 27, 27, 0.28); }
    @media (max-width: 600px) {
      .content-cell { padding: 24px 20px !important; }
      .header-title { font-size: 24px !important; line-height: 30px !important; }
      .btn-cta { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body>
  <div style="background-color: #F3F0E8; padding: 30px 16px;">
    <div class="email-container">
      <div style="background-color: #991B1B; height: 6px;"></div>
      <div class="content-cell" style="padding: 32px 36px 16px;">
        <table style="width: 100%;">
          <tr>
            <td>
              <div style="display: inline-block; background-color: #991B1B; color: #FFFFFF; font-family: 'Arial Black', Impact, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 0.5px; padding: 6px 12px; border-radius: 8px;">
                SP <span style="color: #FCD34D;">MARKET</span>
              </div>
            </td>
            <td style="text-align: right;">
              <span style="background-color: #ECFDF5; color: #065F46; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; border: 1px solid #A7F3D0;">
                ✓ Email Verification
              </span>
            </td>
          </tr>
        </table>
      </div>
      <div class="content-cell" style="padding: 10px 36px 24px;">
        <h1 class="header-title" style="margin: 0 0 14px; font-size: 28px; font-weight: 800; line-height: 34px; color: #18181B; letter-spacing: -0.02em;">
          Confirm your email address
        </h1>
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 24px; color: #4B5563;">
          Welcome to <strong>St. Peter's Marketplace</strong>! You're just one step away from connecting with students across St. Peter's Hostel, Kotei.
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #6B7280;">
          Please click the button below to verify your email address and activate your vendor account.
        </p>
        <div style="background-color: #FAF8F5; border: 1px dashed #D6D0C4; border-radius: 14px; padding: 22px 18px; text-align: center; margin-bottom: 24px;">
          <a href="{{ .ConfirmationURL }}" class="btn-cta" target="_blank">Verify My Email &amp; Activate Account →</a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #71717A;">⏱ This verification link expires in 24 hours</p>
        </div>
        <div style="background-color: #F8F9FA; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #4B5563; text-transform: uppercase;">Button not working?</p>
          <p style="margin: 0; font-size: 11px; color: #6B7280; word-break: break-all; font-family: monospace;"><a href="{{ .ConfirmationURL }}" style="color:#991B1B;">{{ .ConfirmationURL }}</a></p>
        </div>
        <div style="padding: 12px 14px; background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 18px; color: #92400E;">
          <strong>Security Notice:</strong> If you did not create an account on St. Peter's Marketplace, you can safely ignore this email.
        </div>
      </div>
      <div style="border-top: 1px solid #E5E7EB;"></div>
      <div style="padding: 20px 36px 28px; text-align: center; background-color: #FAF8F5;">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #18181B;">St. Peter's Marketplace · Kotei, Kumasi</p>
        <p style="margin: 0 0 8px; font-size: 11px; color: #71717A;">The dedicated hostel trading hub for St. Peter's Hostel residents &amp; KNUST students.</p>
        <p style="margin: 0; font-size: 10px; color: #A1A1AA;">&copy; 2026 St. Peter's Marketplace</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const RESET_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your St. Peter's Marketplace password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F3F0E8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181B; }
    .email-container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #E4E0D7; }
    .btn-cta { display: inline-block; background-color: #991B1B; color: #FFFFFF !important; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(153, 27, 27, 0.28); }
    @media (max-width: 600px) {
      .content-cell { padding: 24px 20px !important; }
      .header-title { font-size: 24px !important; line-height: 30px !important; }
      .btn-cta { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body>
  <div style="background-color: #F3F0E8; padding: 30px 16px;">
    <div class="email-container">
      <div style="background-color: #991B1B; height: 6px;"></div>
      <div class="content-cell" style="padding: 32px 36px 16px;">
        <table style="width: 100%;">
          <tr>
            <td>
              <div style="display: inline-block; background-color: #991B1B; color: #FFFFFF; font-family: 'Arial Black', Impact, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 0.5px; padding: 6px 12px; border-radius: 8px;">
                SP <span style="color: #FCD34D;">MARKET</span>
              </div>
            </td>
            <td style="text-align: right;">
              <span style="background-color: #FEF2F2; color: #991B1B; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; border: 1px solid #FECACA;">
                🔒 Password Reset
              </span>
            </td>
          </tr>
        </table>
      </div>
      <div class="content-cell" style="padding: 10px 36px 24px;">
        <h1 class="header-title" style="margin: 0 0 14px; font-size: 28px; font-weight: 800; line-height: 34px; color: #18181B; letter-spacing: -0.02em;">
          Reset your password
        </h1>
        <p style="margin: 0 0 14px; font-size: 15px; line-height: 24px; color: #4B5563;">
          We received a request to reset the password for your <strong>St. Peter's Marketplace</strong> account.
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #6B7280;">
          Click the button below to choose a new password. For security reasons, this link can only be used once.
        </p>
        <div style="background-color: #FAF8F5; border: 1px dashed #D6D0C4; border-radius: 14px; padding: 22px 18px; text-align: center; margin-bottom: 24px;">
          <a href="{{ .ConfirmationURL }}" class="btn-cta" target="_blank">Reset My Password →</a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #71717A;">⏱ This reset link expires in 1 hour</p>
        </div>
        <div style="background-color: #F8F9FA; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; color: #4B5563; text-transform: uppercase;">Button not working?</p>
          <p style="margin: 0; font-size: 11px; color: #6B7280; word-break: break-all; font-family: monospace;"><a href="{{ .ConfirmationURL }}" style="color:#991B1B;">{{ .ConfirmationURL }}</a></p>
        </div>
        <div style="padding: 12px 14px; background-color: #F4F4F5; border-left: 4px solid #71717A; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 18px; color: #3F3F46;">
          <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your current password remains unchanged.
        </div>
      </div>
      <div style="border-top: 1px solid #E5E7EB;"></div>
      <div style="padding: 20px 36px 28px; text-align: center; background-color: #FAF8F5;">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #18181B;">St. Peter's Marketplace · Kotei, Kumasi</p>
        <p style="margin: 0 0 8px; font-size: 11px; color: #71717A;">The dedicated hostel trading hub for St. Peter's Hostel residents &amp; KNUST students.</p>
        <p style="margin: 0; font-size: 10px; color: #A1A1AA;">&copy; 2026 St. Peter's Marketplace</p>
      </div>
    </div>
  </div>
</body>
</html>`;

export default function renderEmailPreview(params, container) {
  let activeTab = 'verification'; // 'verification' | 'reset'
  let isMobileView = false;

  container.innerHTML = `
    <div class="container section-sm" style="max-width: 900px;">
      <div class="flex items-center justify-between" style="margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <a href="#/dashboard" class="back-link" style="margin-bottom: var(--space-2);">
            ${icon('arrow-left', { size: 16 })} Back to Dashboard
          </a>
          <h1 style="font-size: clamp(2rem, 5vw, 2.8rem); margin: 0;">Email Templates Preview</h1>
          <p class="text-muted" style="margin: var(--space-1) 0 0;">Inspect and copy the templates for your Supabase Auth emails</p>
        </div>

        <div class="flex gap-2">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-html">
            ${icon('package', { size: 16 })} Copy HTML Code
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="btn-toggle-viewport">
            ${icon('electronics', { size: 16 })} <span id="viewport-label">Mobile view</span>
          </button>
        </div>
      </div>

      <!-- Template Tabs -->
      <div class="filter-pills" style="margin-bottom: var(--space-6);">
        <button type="button" class="filter-pill active" data-tab="verification">
          ${icon('mail', { size: 16 })} 1. Email Verification (Signup)
        </button>
        <button type="button" class="filter-pill" data-tab="reset">
          ${icon('key', { size: 16 })} 2. Forgot Password (Reset)
        </button>
      </div>

      <!-- Info Banner -->
      <div style="background: var(--color-paper-2); border-left: 4px solid var(--color-primary); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6); font-size: var(--font-sm);">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: var(--color-ink);" id="subject-preview">
          Subject: Verify your St. Peter's Marketplace account
        </p>
        <p style="margin: 0; color: var(--color-ink-2);">
          Paste this template into Supabase Dashboard &rarr; <strong>Authentication</strong> &rarr; <strong>Email Templates</strong> &rarr; <span id="supabase-slot-name">Confirm signup</span>.
        </p>
      </div>

      <!-- Preview Frame Container -->
      <div style="background: var(--color-paper-3); padding: var(--space-6); border-radius: var(--radius-xl); display: flex; justify-content: center; overflow: hidden; min-height: 520px;">
        <iframe id="email-iframe" style="width: 100%; max-width: 620px; height: 640px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #F3F0E8; transition: max-width 0.3s ease;"></iframe>
      </div>
    </div>
  `;

  const iframe = container.querySelector('#email-iframe');
  const copyBtn = container.querySelector('#btn-copy-html');
  const toggleViewportBtn = container.querySelector('#btn-toggle-viewport');
  const viewportLabel = container.querySelector('#viewport-label');
  const subjectPreview = container.querySelector('#subject-preview');
  const slotName = container.querySelector('#supabase-slot-name');

  function updateIframe() {
    const rawHtml = activeTab === 'verification' ? VERIFICATION_HTML : RESET_HTML;
    // Replace {{ .ConfirmationURL }} with an illustrative sample link for preview
    const previewContent = rawHtml.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, '#/auth/reset-password');

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(previewContent);
    doc.close();

    if (activeTab === 'verification') {
      subjectPreview.textContent = "Recommended Subject: Verify your St. Peter's Marketplace account";
      slotName.textContent = 'Confirm signup';
    } else {
      subjectPreview.textContent = "Recommended Subject: Reset your St. Peter's Marketplace password";
      slotName.textContent = 'Reset password';
    }
  }

  container.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      updateIframe();
    });
  });

  toggleViewportBtn.addEventListener('click', () => {
    isMobileView = !isMobileView;
    iframe.style.maxWidth = isMobileView ? '375px' : '620px';
    viewportLabel.textContent = isMobileView ? 'Desktop view' : 'Mobile view';
  });

  copyBtn.addEventListener('click', async () => {
    const code = activeTab === 'verification' ? VERIFICATION_HTML : RESET_HTML;
    try {
      await navigator.clipboard.writeText(code);
      showToast('HTML template copied to clipboard!', 'success');
    } catch {
      showToast('Please copy from supabase/email-templates/ folder', 'info');
    }
  });

  updateIframe();
}
