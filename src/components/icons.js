/**
 * Inline SVG icon set.
 *
 * Every icon is a 24x24 stroked path that inherits `currentColor`, so icons
 * take the colour of whatever text or button contains them. No emoji is used
 * anywhere in the UI — emoji render differently on every platform and cannot
 * be recoloured or sized reliably.
 */

const PATHS = {
  /* ---- Categories ---- */
  // Food & Snacks — a bowl with steam
  'food-snacks':
    '<path d="M4 13h16a8 8 0 0 1-16 0Z"/><path d="M2 19h20"/><path d="M9 6c0-1 1-1 1-2s-1-1-1-2"/><path d="M14 6c0-1 1-1 1-2s-1-1-1-2"/>',
  // Electronics — a phone
  electronics:
    '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
  // Books — an open book
  books:
    '<path d="M12 7v14"/><path d="M3 18V4a1 1 0 0 1 1-1h5a3 3 0 0 1 3 3 3 3 0 0 1 3-3h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2H4a1 1 0 0 1-1-1Z"/>',
  // Clothing — a t-shirt
  clothing:
    '<path d="M15 3a3 3 0 0 1-6 0L4 5l2 4 2-1v13h8V8l2 1 2-4-5-2Z"/>',
  // Services — scissors
  services:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9"/><path d="m8.1 8.1 11.9 11.9"/>',
  // Others — a box
  others:
    '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',

  /* ---- Navigation & UI ---- */
  store:
    '<path d="M3 9 4.5 4h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-5h4v5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sliders:
    '<path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="18" cy="18" r="2"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  upload:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/>',

  /* ---- Status & feedback ---- */
  check: '<path d="m20 6-11 11-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 16.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>',
  flag: '<path d="M4 21V4"/><path d="M4 4h12l-2 4 2 4H4"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off':
    '<path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6"/><path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/>',
  heart:
    '<path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.6 12 20 12 20Z"/>',

  /* ---- Actions ---- */
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  logout:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login:
    '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',

  /* ---- Contact ---- */
  whatsapp:
    '<path d="M3 21l1.6-4.5A8.3 8.3 0 1 1 7.8 19.6L3 21Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4.6 4.6 0 0 1-2-2l1-1-1-2-1.5 1Z"/>',
  phone:
    '<path d="M21 16.9v2.6a1.5 1.5 0 0 1-1.7 1.5 17.5 17.5 0 0 1-15.3-15.3A1.5 1.5 0 0 1 5.5 4h2.6a1.5 1.5 0 0 1 1.5 1.3c.1.9.3 1.8.6 2.6a1.5 1.5 0 0 1-.4 1.6l-1 1a14 14 0 0 0 5.7 5.7l1-1a1.5 1.5 0 0 1 1.6-.4c.8.3 1.7.5 2.6.6A1.5 1.5 0 0 1 21 16.9Z"/>',

  /* ---- Profile & places ---- */
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a7 7 0 0 1 4 7"/>',
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M10 21v-6h4v6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  tag:
    '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  package:
    '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  chart:
    '<path d="M3 3v18h18"/><path d="M7 15v3"/><path d="M12 10v8"/><path d="M17 6v12"/>',
  video:
    '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8Z"/>',
  play: '<path d="M7 4v16l13-8-13-8Z"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  wifi_off:
    '<path d="M2 2l20 20"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 3.5-2.3"/><path d="M15.5 10.6a10 10 0 0 1 3.5 2.3"/><path d="M2 8.8a15 15 0 0 1 5-3"/><path d="M17 5.8a15 15 0 0 1 5 3"/><path d="M12 20h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle:
    '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>',
  handshake:
    '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m15 17 1.5 1.5a1.4 1.4 0 0 0 2-2L13 11"/><path d="M2 10 6 6l4 1 3 3-2 2a2 2 0 0 1-3 0L6 10"/><path d="m22 10-4-4-4 1"/>',
};

/**
 * Render an icon as an inline SVG string.
 * @param {string} name - a key of the icon set
 * @param {Object} [options]
 * @param {number} [options.size] - width/height in px (default 20)
 * @param {string} [options.className] - extra classes on the <svg>
 * @param {string} [options.title] - accessible label; omit for decorative icons
 * @param {number} [options.strokeWidth]
 * @returns {string} SVG markup, safe to interpolate into innerHTML
 */
export function icon(name, options = {}) {
  const { size = 20, className = '', title = '', strokeWidth = 1.8 } = options;
  const path = PATHS[name];
  if (!path) {
    console.warn(`Unknown icon: ${name}`);
    return '';
  }

  // A titled icon is announced by screen readers; an untitled one is hidden.
  const a11y = title
    ? `role="img" aria-label="${title.replace(/"/g, '&quot;')}"`
    : 'aria-hidden="true" focusable="false"';

  const classes = className ? `icon ${className}` : 'icon';

  return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${path}</svg>`;
}

/** True when the icon set contains this key. */
export function hasIcon(name) {
  return Object.prototype.hasOwnProperty.call(PATHS, name);
}

/** All available icon names — used by tests to guard against typos. */
export function iconNames() {
  return Object.keys(PATHS);
}
