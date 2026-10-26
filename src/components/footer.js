/**
 * Render the site footer into #footer. Static — rendered once on app start,
 * so it carries no logged-in/logged-out links (the navbar and tab bar
 * handle those).
 */
export function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  const year = new Date().getFullYear();

  footer.className = 'footer';
  footer.innerHTML = `
    <div class="container footer-in">
      <a href="#/" class="footer-brand">SP <span>Market</span></a>
      <nav class="footer-links" aria-label="Footer">
        <a href="#/products">Browse</a>
        <a href="#/dashboard/new">Sell an item</a>
        <a href="#/dashboard">My listings</a>
      </nav>
      <p class="footer-note">
        The classifieds of St. Peter's Hostel, Kotei, near KNUST &middot; Run by <a href="https://SKETech.dev" class="footer-links">SKETech </a> &middot; &copy; ${year}
      </p>
    </div>
  `;
}
