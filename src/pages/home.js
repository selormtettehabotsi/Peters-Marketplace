import { CATEGORIES } from '../lib/constants.js';
import { fetchLatestProducts, fetchMarketplaceStats } from '../lib/api.js';
import { renderProductGrid } from '../components/product-card.js';
import { renderSkeletonGrid } from '../components/skeleton-loader.js';
import { icon } from '../components/icons.js';
import { isLoggedIn } from '../lib/auth.js';
import { watchNavigation } from '../router.js';

const STEPS = [
  {
    icon: 'user',
    title: 'Sign Up',
    text: 'Create your account with your room number in under a minute.',
  },
  {
    icon: 'image',
    title: 'List Your Item',
    text: 'Add photos, a short video and the details of what you are selling.',
  },
  {
    icon: 'handshake',
    title: 'Sell',
    text: 'Buyers in the hostel reach you directly on WhatsApp or by phone.',
  },
];

const SHOWCASE_PAIRS = [
  {
    category: 'Clothing & Apparel',
    tab: 'Apparel',
    front: {
      image: '/images/showcase/showcase-apparel.jpg',
      title: 'Varsity Bomber Jacket',
      sub: 'Room 118 • Size L • Mint',
      price: 'GH₵ 220',
    },
    back: {
      image: '/images/showcase/showcase-trousers.jpg',
      title: 'Streetwear Cargo Trousers',
      sub: 'Room 204 • Size 32 • Like New',
      price: 'GH₵ 140',
    },
    categoryQuery: 'clothing',
  },
  {
    category: 'Shoes & Footwear',
    tab: 'Footwear',
    front: {
      image: '/images/showcase/showcase-sneakers.jpg',
      title: 'Nike Dunk Low Terracotta',
      sub: 'Room 204 • Size 42 • Boxed',
      price: 'GH₵ 380',
    },
    back: {
      image: '/images/showcase/showcase-slides.jpg',
      title: 'Campus Athletic Slides',
      sub: 'Room 105 • Size 43 • Fresh',
      price: 'GH₵ 90',
    },
    categoryQuery: 'clothing',
  },
  {
    category: 'Electronics & Study Tech',
    tab: 'Tech',
    front: {
      image: '/images/showcase/showcase-tech.jpg',
      title: 'MacBook Air M2 Setup',
      sub: 'Room 315 • 8GB/256GB • Clean',
      price: 'GH₵ 6,400',
    },
    back: {
      image: '/images/showcase/showcase-headphones.jpg',
      title: 'Wireless Pro Headphones',
      sub: 'Room 212 • ANC Active',
      price: 'GH₵ 450',
    },
    categoryQuery: 'electronics',
  },
  {
    category: 'Room Living & Appliances',
    tab: 'Appliances',
    front: {
      image: '/images/showcase/showcase-appliances.jpg',
      title: 'Electric Kettle (1.7L)',
      sub: 'Room 402 • 1500W Fast Boil',
      price: 'GH₵ 95',
    },
    back: {
      image: '/images/showcase/showcase-lamp.jpg',
      title: 'LED Desk Study Lamp',
      sub: 'Room 301 • Adjustable Arm',
      price: 'GH₵ 75',
    },
    categoryQuery: 'others',
  },
];

/**
 * Landing page — full-width HD dimmed hostel backdrop hero,
 * paired leaning cards showcase, categories, latest listings and how-it-works.
 * @param {Object} params
 * @param {HTMLElement} container
 */
export default async function renderHome(params, container) {
  const isStale = watchNavigation();

  container.innerHTML = `
    <!-- Hero Section with Full-Width Dimmed HD Hostel Backdrop -->
    <section class="hero">
      <div class="container">
        <div class="hero-grid">
          <!-- Left: Hero Headline & Search Action (Deeply Dimmed Scrim for High Contrast) -->
          <div class="hero-content">
            <h1>Buy &amp; Sell at <span class="text-primary-accent">St. Peter's Hostel</span></h1>
            <p class="hero-subtitle">
              The direct marketplace for residents in Kotei. Pass down textbooks, appliances, room tech, and essentials to neighbors across every floor.
            </p>
            <div class="hero-cta">
              <a href="#/products" class="btn btn-primary btn-lg">
                ${icon('search', { size: 18 })} Browse Listings
              </a>
              <a href="${isLoggedIn() ? '#/dashboard/new' : '#/auth/signup'}" class="btn btn-secondary btn-lg">
                ${icon('plus', { size: 18 })} Post an Item
              </a>
            </div>
            <div class="hero-stats" id="hero-stats">
              <div class="stat-item">
                ${icon('package', { size: 16 })}
                <span><span class="stat-number" id="stat-products">0</span> Products</span>
              </div>
              <div class="stat-item">
                ${icon('users', { size: 16 })}
                <span><span class="stat-number" id="stat-sellers">0</span> Sellers</span>
              </div>
              <div class="stat-item">
                ${icon('tag', { size: 16 })}
                <span><span class="stat-number">${CATEGORIES.length}</span> Categories</span>
              </div>
            </div>
          </div>

          <!-- Right: Two Leaning Cards Showcase (Pair of Items per Category) -->
          <div class="leaning-showcase-container">
            <!-- 3D Leaning Cards Stage -->
            <div class="leaning-stage" id="leaning-stage">
              ${SHOWCASE_PAIRS.map(
                (pair, idx) => `
                <div class="leaning-slide ${idx === 0 ? 'active' : ''}" data-slide="${idx}">
                  <!-- Back Leaning Card (Tilted Right) -->
                  <a href="#/products?category=${pair.categoryQuery}" class="leaning-card-back" title="View ${pair.back.title}">
                    <img src="${pair.back.image}" alt="${pair.back.title}" loading="${idx === 0 ? 'eager' : 'lazy'}">
                  </a>

                  <!-- Front Leaning Card (Tilted Left) -->
                  <a href="#/products?category=${pair.categoryQuery}" class="leaning-card-front" title="View ${pair.front.title}">
                    <img src="${pair.front.image}" alt="${pair.front.title}" loading="${idx === 0 ? 'eager' : 'lazy'}">
                  </a>
                </div>
              `
              ).join('')}
            </div>

            <!-- Navigation Controls & Dots -->
            <div class="leaning-controls">
              <div class="leaning-dots" id="leaning-dots">
                ${SHOWCASE_PAIRS.map(
                  (_, idx) => `
                  <span class="leaning-dot ${idx === 0 ? 'active' : ''}" data-dot="${idx}"></span>
                `
                ).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section-sm" id="categories-section">
      <div class="container">
        <h2 class="mb-6">Browse Categories</h2>
        <div class="pill-group" id="category-pills">
          ${CATEGORIES.map(
            (c) => `
            <a href="#/products?category=${c.id}" class="pill">
              ${icon(c.icon, { size: 16 })} ${c.name}
            </a>
          `
          ).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="featured-section">
      <div class="container">
        <div class="flex items-center justify-between mb-6">
          <h2>Latest Listings</h2>
          <a href="#/products" class="btn btn-ghost btn-sm">
            View All ${icon('arrow-right', { size: 16 })}
          </a>
        </div>
        <div class="product-grid stagger-children" id="featured-grid"></div>
      </div>
    </section>

    <section class="how-it-works">
      <div class="container">
        <h2>How It Works</h2>
        <p class="text-muted">Three simple steps to buy and sell inside St. Peter's Hostel</p>
        <div class="steps-grid">
          ${STEPS.map(
            (step, i) => `
            <div class="step-card">
              <span class="step-icon">${icon(step.icon, { size: 28 })}</span>
              <div><span class="step-number">${i + 1}</span></div>
              <h3 class="h4 mb-2">${step.title}</h3>
              <p class="text-sm text-muted">${step.text}</p>
            </div>
          `
          ).join('')}
        </div>
      </div>
    </section>
  `;

  // Attach Leaning Cards Carousel Behavior
  setupLeaningCarousel(container);

  const grid = container.querySelector('#featured-grid');
  renderSkeletonGrid(grid, 8);

  // Products and counts load in parallel — neither blocks the other.
  const [{ products, error }, stats] = await Promise.all([
    fetchLatestProducts(8),
    fetchMarketplaceStats(),
  ]);
  if (isStale()) return;

  if (!stats.error) {
    const productEl = container.querySelector('#stat-products');
    const sellerEl = container.querySelector('#stat-sellers');
    if (productEl) productEl.textContent = String(stats.products);
    if (sellerEl) sellerEl.textContent = String(stats.sellers);
  }

  if (error) {
    const isMissingTables = error?.code === 'PGRST205' || String(error?.message || '').includes('schema cache');
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">${icon('alert', { size: 32 })}</div>
        <div class="empty-title">${isMissingTables ? 'Database Tables Not Initialized' : "Couldn't load listings"}</div>
        <div class="empty-description">
          ${
            isMissingTables
              ? 'Connected to Supabase, but the database schema has not been run yet. Please run <code>supabase/schema.sql</code> in your Supabase SQL Editor.'
              : 'Check your connection, or configure Supabase in <code>src/supabase.js</code>.'
          }
        </div>
      </div>
    `;
    return;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">${icon('package', { size: 32 })}</div>
        <div class="empty-title">No listings yet</div>
        <div class="empty-description">Be the first to sell something to your hostel mates.</div>
        <a href="#/dashboard/new" class="btn btn-primary">Create a Listing</a>
      </div>
    `;
    return;
  }

  renderProductGrid(grid, products);
}

/**
 * Sets up the two-leaning-cards carousel with category tabs,
 * nav buttons, indicator dots, and auto-advance.
 * @param {HTMLElement} container
 */
function setupLeaningCarousel(container) {
  const slides = container.querySelectorAll('.leaning-slide');
  const dots = container.querySelectorAll('.leaning-dot');
  const stage = container.querySelector('#leaning-stage');

  if (!slides.length) return;

  let currentIndex = 0;
  let timer = null;

  function goToSlide(index) {
    if (index < 0) index = SHOWCASE_PAIRS.length - 1;
    if (index >= SHOWCASE_PAIRS.length) index = 0;
    currentIndex = index;

    slides.forEach((s, i) => s.classList.toggle('active', i === currentIndex));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 2000);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(dot.dataset.dot, 10);
      goToSlide(idx);
      startTimer();
    });
  });

  if (stage) {
    stage.addEventListener('mouseenter', stopTimer);
    stage.addEventListener('mouseleave', startTimer);
  }

  startTimer();
}
