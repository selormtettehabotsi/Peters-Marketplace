/**
 * Browser smoke test: loads each route in a real browser, captures console
 * errors, and screenshots the result.
 *
 * Supabase keys are placeholders, so data fetches are expected to fail —
 * the point is that every page renders its shell, navigation works, and
 * nothing throws a JavaScript error.
 *
 * Run with: node scripts/smoke.mjs
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = resolve(ROOT, '.smoke');
const BASE = process.env.BASE_URL || 'http://localhost:4173';

mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  { hash: '#/', name: 'home', expect: "Buy & Sell at St. Peter's Hostel" },
  { hash: '#/products', name: 'products', expect: 'All Products' },
  { hash: '#/products?q=laptop', name: 'products-search', expect: 'Results for "laptop"' },
  { hash: '#/products?category=books', name: 'products-category', expect: 'Books' },
  { hash: '#/auth/login', name: 'login', expect: 'Welcome Back' },
  { hash: '#/auth/signup', name: 'signup', expect: 'Join the Marketplace' },
  // The lookup against the placeholder Supabase host has to fail before the
  // 404 state renders, which takes several seconds.
  { hash: '#/products/does-not-exist', name: 'product-404', expect: 'Product Not Found', wait: 8000 },
  { hash: '#/nowhere', name: 'route-404', expect: 'Page Not Found' },
  // Guarded routes bounce a logged-out visitor to the login page — the auth
  // check runs before the admin check, so /admin lands on login too.
  { hash: '#/dashboard', name: 'dashboard-guard', expect: 'Welcome Back' },
  { hash: '#/admin', name: 'admin-guard', expect: 'Welcome Back' },
];

const failures = [];
const consoleErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  // Expected: the placeholder Supabase host does not resolve.
  if (/placeholder\.supabase\.co|Failed to load resource|net::ERR/i.test(text)) return;
  consoleErrors.push(text);
});

page.on('pageerror', (err) => consoleErrors.push(`Uncaught: ${err.message}`));

for (const route of ROUTES) {
  consoleErrors.length = 0;

  await page.goto(`${BASE}/${route.hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(route.wait ?? 600); // let async route handlers settle

  const body = await page.textContent('body');
  const found = body.includes(route.expect);

  await page.screenshot({ path: resolve(SHOTS, `${route.name}.png`), fullPage: false });

  if (!found) {
    failures.push(`${route.name}: expected text "${route.expect}" not found`);
  }
  if (consoleErrors.length) {
    failures.push(`${route.name}: console errors → ${consoleErrors.join(' | ')}`);
  }

  console.log(`${found && !consoleErrors.length ? 'PASS' : 'FAIL'}  ${route.name.padEnd(20)} ${route.hash}`);
}

/* ---- Interaction checks ---- */

// Navbar search navigates to a filtered listing
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.fill('#nav-search', 'charger');
await page.press('#nav-search', 'Enter');
await page.waitForTimeout(500);
if (!page.url().includes('q=charger')) {
  failures.push(`navbar search: expected q=charger in URL, got ${page.url()}`);
}
console.log(`${page.url().includes('q=charger') ? 'PASS' : 'FAIL'}  navbar-search`);

// Login form shows inline validation errors rather than submitting
await page.goto(`${BASE}/#/auth/login`, { waitUntil: 'networkidle' });
await page.click('#login-submit');
await page.waitForTimeout(300);
const emailError = await page.textContent('[data-error-for="email"]');
if (!emailError?.includes('required')) {
  failures.push(`login validation: expected a required-field error, got "${emailError}"`);
}
await page.screenshot({ path: resolve(SHOTS, 'login-validation.png') });
console.log(`${emailError?.includes('required') ? 'PASS' : 'FAIL'}  login-validation`);

// Category pill on the listing page updates the URL
await page.goto(`${BASE}/#/products`, { waitUntil: 'networkidle' });
await page.click('[data-category="electronics"]');
await page.waitForTimeout(500);
if (!page.url().includes('category=electronics')) {
  failures.push(`category filter: URL did not update, got ${page.url()}`);
}
console.log(`${page.url().includes('category=electronics') ? 'PASS' : 'FAIL'}  category-filter`);

// Mobile layout: hamburger opens the menu
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' });
await page.click('#mobile-menu-toggle');
await page.waitForTimeout(300);
const menuOpen = await page.isVisible('.mobile-menu');
if (!menuOpen) failures.push('mobile menu: did not open on hamburger click');
await page.screenshot({ path: resolve(SHOTS, 'mobile-home.png'), fullPage: false });
console.log(`${menuOpen ? 'PASS' : 'FAIL'}  mobile-menu`);

// No emoji should survive anywhere in the rendered UI
await page.setViewportSize({ width: 1280, height: 900 });
const emojiFound = [];
for (const hash of ['#/', '#/products', '#/auth/signup']) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const text = await page.textContent('body');
  const matches = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu);
  if (matches) emojiFound.push(`${hash}: ${[...new Set(matches)].join(' ')}`);
}
if (emojiFound.length) failures.push(`emoji found in UI → ${emojiFound.join(' | ')}`);
console.log(`${emojiFound.length === 0 ? 'PASS' : 'FAIL'}  no-emoji`);

await browser.close();

console.log('\n' + '='.repeat(60));
if (failures.length) {
  console.log(`${failures.length} FAILURE(S):`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log('All smoke checks passed.');
console.log(`Screenshots: ${SHOTS}`);
