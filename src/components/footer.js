import { icon } from './icons.js';

/**
 * Render the site footer into #footer. Static — rendered once on app start.
 */
export function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand flex items-center gap-2">
            ${icon('store', { size: 24 })}
            <span>St. Peter's Marketplace</span>
          </div>
          <p class="text-sm">
            Made for St. Peter's Hostel, Kotei — near KNUST, Kumasi.
            Buy and sell anything with your hostel mates.
          </p>
        </div>

        <div>
          <h4 class="footer-heading">Marketplace</h4>
          <ul>
            <li><a href="#/products">Browse Products</a></li>
            <li><a href="#/dashboard/new">Sell an Item</a></li>
            <li><a href="#/dashboard">My Dashboard</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-heading">Account</h4>
          <ul>
            <li><a href="#/auth/login">Log In</a></li>
            <li><a href="#/auth/signup">Sign Up</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p style="margin:0;">&copy; ${year} St. Peter's Marketplace · Kotei, Kumasi</p>
      </div>
    </div>
  `;
}
