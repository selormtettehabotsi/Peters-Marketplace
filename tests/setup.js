import { beforeEach, vi } from 'vitest';

/**
 * Shared test setup: rebuilds the app shell before each test so pages and
 * components always find #page-content, #toast-container and #modal-container.
 */

beforeEach(() => {
  document.body.innerHTML = `
    <div id="app">
      <nav id="navbar"></nav>
      <main id="page-content"></main>
      <footer id="footer"></footer>
    </div>
    <div id="toast-container" aria-live="polite"></div>
    <div id="modal-container"></div>
  `;
  window.location.hash = '';
});

// jsdom implements neither of these; components call them on image previews.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
}

// jsdom has no layout engine, so scrollTo is a no-op stub.
window.scrollTo = vi.fn();
