import { CATEGORIES, getCondition } from '../lib/constants.js';
import { fetchLatestProducts, fetchMarketplaceStats, fetchCategoryCounts } from '../lib/api.js';
import { renderProductGrid, cardImageUrl } from '../components/product-card.js';
import { renderSkeletonGrid } from '../components/skeleton-loader.js';
import { icon } from '../components/icons.js';
import { isLoggedIn } from '../lib/auth.js';
import { formatPrice, timeAgo, escapeHtml } from '../lib/format.js';
import { navigate, watchNavigation } from '../router.js';

const SELL_STEPS = [
  { title: 'Post it', text: 'One photo and a price in cedis. Your room number goes on for you.' },
  { title: 'Get a message', text: 'Buyers tap WhatsApp or Call on your listing. No middleman, no fees.' },
  { title: 'Meet at your door', text: 'Hand it over, then mark it sold so nobody else knocks.' },
];

/** One lead story plus a 3 x 2 grid underneath. */
const LATEST_COUNT = 7;

/**
 * The newest listing, run large like a newspaper's lead story.
 * @param {Object} product
 * @returns {string} HTML
 */
function leadStory(product) {
  const seller = product.profiles || {};
  const condition = getCondition(product.condition);
  return `
    <article class="lead-story" data-href="#/products/${product.id}">
      <img src="${escapeHtml(product.image_urls?.[0] || cardImageUrl(product))}"
           alt="${escapeHtml(product.title)}" />
      <div>
        <div class="lead-kicker">
          <span class="lead-new">Just listed</span>
          <span>${escapeHtml(condition.name)}</span>
          ${seller.room_number ? `<span>Room ${escapeHtml(seller.room_number)}</span>` : ''}
          <span>${escapeHtml(timeAgo(product.created_at))}</span>
        </div>
        <h2 class="lead-title">
          <a href="#/products/${product.id}">${escapeHtml(product.title)}</a>
        </h2>
        ${product.description ? `<p class="lead-desc">${escapeHtml(product.description)}</p>` : ''}
        <div class="lead-deal">
          <span class="lead-price">${escapeHtml(formatPrice(product.price))}</span>
          <a href="#/products/${product.id}" class="btn btn-whatsapp btn-lg">
            ${icon('whatsapp', { size: 18 })} Contact seller
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Landing page — "Classifieds" layout: masthead, search, a line of
 * categories, the newest listing as the lead story, the rest in a grid,
 * and a solid "List it free." block.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default async function renderHome(params, container) {
  const isStale = watchNavigation();
  const sellHref = isLoggedIn() ? '#/dashboard/new' : '#/auth/signup';

  container.innerHTML = `
    <section class="container">
      <div class="home-masthead">
        <h1 class="masthead-title">SP <span>Market</span></h1>
        <p class="masthead-tag">
          <span class="cap">The classifieds of St. Peter's</span>
          <span id="masthead-count">Things for sale by the people in your hostel.</span>
          Message the seller, meet at their door.
        </p>
      </div>

      <form class="home-search" id="home-search" role="search">
        <input
          type="search"
          name="q"
          placeholder="Search listings…"
          aria-label="Search listings"
          enterkeyhint="search"
        />
        <button type="submit" class="btn">Search</button>
      </form>

      <nav class="cat-line" aria-label="Categories">
        ${CATEGORIES.map(
          (c) =>
            `<a href="#/products?category=${c.id}">${c.name}<sup data-count="${c.id}"></sup></a>`
        ).join('')}
      </nav>

      <!-- Front-page photo: the building itself, captioned like a newspaper -->
      <figure class="hostel-photo">
        <img
          src="/images/hostel/hostel-building-1600.webp"
          srcset="/images/hostel/hostel-building-800.webp 800w, /images/hostel/hostel-building-1600.webp 1600w"
          sizes="(max-width: 1240px) 100vw, 1170px"
          alt="St. Peter's Hostel in Kotei: orange-red and grey blocks behind the front wall"
          width="1600"
          height="900"
          fetchpriority="high"
        />
        <figcaption>St. Peter's Hostel, Kotei. Every listing here is from someone inside these walls.</figcaption>
      </figure>
    </section>

    <section class="container home-section" id="lead-section" aria-label="Newest listing">
      <div class="lead-story" aria-hidden="true">
        <div class="skeleton" style="aspect-ratio: 4 / 3; border-radius: var(--radius-2xl);"></div>
        <div>
          <div class="skeleton skeleton-text" style="width: 40%;"></div>
          <div class="skeleton skeleton-title" style="height: 3em; width: 90%;"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-button mt-6"></div>
        </div>
      </div>
    </section>

    <section class="container home-section" id="featured-section">
      <div class="section-heading">
        <h2 class="section-title">Also for sale</h2>
        <a href="#/products" class="section-link">See all ${icon('arrow-right', { size: 16 })}</a>
      </div>
      <div class="product-grid product-grid-3 stagger-children" id="featured-grid"></div>
    </section>

    <section class="container">
      <div class="sell-block">
        <div>
          <h2>List it free.</h2>
          <a href="${sellHref}" class="btn btn-lg">Sell an item ${icon('arrow-right', { size: 18 })}</a>
        </div>
        <ol class="sell-steps">
          ${SELL_STEPS.map(
            (step, i) => `
            <li>
              <b>${i + 1}</b>
              <h3>${step.title}</h3>
              <p>${step.text}</p>
            </li>
          `
          ).join('')}
        </ol>
      </div>
    </section>
  `;

  container.querySelector('#home-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const term = new FormData(e.currentTarget).get('q').trim();
    navigate(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
  });

  // The lead story is a link as a whole, not only its title and button.
  container.querySelector('#lead-section').addEventListener('click', (e) => {
    const story = e.target.closest('.lead-story[data-href]');
    if (story && !e.target.closest('a')) window.location.hash = story.dataset.href;
  });

  const leadSection = container.querySelector('#lead-section');
  const featured = container.querySelector('#featured-section');
  const grid = container.querySelector('#featured-grid');
  renderSkeletonGrid(grid, 6);

  // Listings, totals and category counts load in parallel.
  const [{ products, error }, stats, { counts }] = await Promise.all([
    fetchLatestProducts(LATEST_COUNT),
    fetchMarketplaceStats(),
    fetchCategoryCounts(),
  ]);
  if (isStale()) return;

  // "0 things for sale" is anti-social-proof — only show real numbers.
  if (!stats.error && stats.products > 0) {
    container.querySelector('#masthead-count').textContent =
      `${stats.products} thing${stats.products === 1 ? '' : 's'} for sale by the people in your hostel.`;
  }
  for (const sup of container.querySelectorAll('[data-count]')) {
    const n = counts[sup.dataset.count];
    if (n) sup.textContent = String(n);
  }

  if (error) {
    const isMissingTables = String(error).includes('schema cache');
    featured.remove();
    leadSection.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('alert', { size: 32 })}</div>
        <div class="empty-title">${isMissingTables ? 'Database not set up' : "Couldn't load listings"}</div>
        <div class="empty-description">
          ${
            isMissingTables
              ? 'Connected to Supabase, but the database schema has not been run yet. Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.'
              : 'Check your connection and try again.'
          }
        </div>
      </div>
    `;
    return;
  }

  if (products.length === 0) {
    featured.remove();
    leadSection.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('package', { size: 32 })}</div>
        <div class="empty-title">Nothing for sale yet</div>
        <div class="empty-description">Be the first to sell something to your hostel mates. It takes a minute.</div>
        <a href="${sellHref}" class="btn btn-primary btn-lg">${icon('plus', { size: 18 })} Sell an item</a>
      </div>
    `;
    return;
  }

  const [lead, ...rest] = products;
  leadSection.innerHTML = leadStory(lead);

  if (rest.length === 0) {
    featured.remove();
    return;
  }
  renderProductGrid(grid, rest);
}
