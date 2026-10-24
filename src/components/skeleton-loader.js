/**
 * Loading placeholders shown while data is in flight.
 * Shapes mirror the real content so the layout does not jump on swap.
 */

/**
 * A skeleton standing in for one product card.
 * @returns {HTMLElement}
 */
export function createSkeletonCard() {
  const card = document.createElement('article');
  card.className = 'card product-card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML = `
    <div class="skeleton skeleton-image"></div>
    <div class="card-body">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text" style="width: 40%;"></div>
      <div class="flex items-center gap-2 mt-4">
        <div class="skeleton skeleton-avatar"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
      </div>
    </div>
  `;
  return card;
}

/**
 * Fill a grid with skeleton cards, replacing whatever is there.
 * @param {HTMLElement} container
 * @param {number} [count]
 */
export function renderSkeletonGrid(container, count = 8) {
  if (!container) return;
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    fragment.appendChild(createSkeletonCard());
  }
  container.appendChild(fragment);
}

/**
 * A skeleton for one table/list row on the dashboard and admin screens.
 * @param {number} [columns]
 * @returns {HTMLElement}
 */
export function createSkeletonRow(columns = 5) {
  const row = document.createElement('tr');
  row.setAttribute('aria-hidden', 'true');
  row.innerHTML = Array.from(
    { length: columns },
    () => '<td><div class="skeleton skeleton-text" style="margin-bottom:0;"></div></td>'
  ).join('');
  return row;
}
