# UI / Frontend Audit — St. Peter's Marketplace

**Date:** 24 Oct 2026
**Scope:** every public route (home, product list, product detail, sold product, login, signup, 404) plus the shared shell (navbar, mobile menu, footer, toasts). Dashboard and admin were reviewed in code only. They share the layout bug in finding 1.
**Method:**
- Screenshots in headless Chromium at 390×844 (a typical Android phone) and 1440×900.
- Two data states: the live Supabase project, which is currently empty, and a mocked catalogue of 14 listings, so the populated UI could be judged too.
- An automated probe that measures rendered font sizes, tap-target sizes and right-edge overflow on mobile.
- WCAG 2.x contrast ratios computed for every key colour pair.
- A full read of `src/styles` and `src/pages`.

**Status:** findings 1–25 below are fixed in the same change as this document. Verification after the fix:
- On mobile, no rendered text is below 12px (the probe found 40 such elements before).
- Nothing overflows the right edge.
- All 184 unit tests pass.
- `npm run smoke` passes.

The items under "Not changed" are still open.

## Who the site is for

Students at a single hostel, almost all on phones, often on patchy mobile data. Buyers want to answer three questions fast: **what is for sale, how much is it, and how do I reach the seller.** Sellers want to post in under a minute. The local reference point is Jiji, Ghana's dominant classifieds app. Its pattern is search first, a category grid, a dense listing grid with a prominent price, and contact buttons always in reach. Anything that delays those three answers is friction.

## Headline verdict

The visual language (terracotta brand, Outfit + Inter, inline SVG icons) is good. The experience fails because:

1. **On a phone the first screen sells the site instead of showing products.** The fold is a marketing hero with stock product photos that auto-rotate every 2 seconds. Search is hidden behind the hamburger, and no real listing appears until about 1,000px of scrolling.
2. **Layout and contrast defects make it look unfinished.** Content runs edge to edge on several pages, the contact buttons fail contrast, and card text is 9–10px.
3. **The empty and early states (the site's actual current state) look broken.** The hero says "0 Products · 0 Sellers", and the empty state's only button reloads the same empty page.

---

## Findings

Severity:
- **P0** is broken or inaccessible.
- **P1** is significant friction.
- **P2** is polish.

### P0 — Broken / inaccessible

| # | Finding | Evidence | Fix |
|---|---|---|---|
| 1 | **Pages lose their side padding.** `.section` and `.section-sm` set `padding: X 0`, and because `utilities.css` loads after `components.css`, they override `.container`'s horizontal padding wherever both classes sit on one element. | Products page on mobile: the title, search and selects touch the screen edge (x = 0). On desktop the content sits 32px left of the navbar. The same markup is on the dashboard, listing form and admin pages. | Make the section utilities set only `padding-top` and `padding-bottom`. |
| 2 | **WhatsApp button text fails contrast: 1.98:1.** White on `#25D366`, and this is the most important button on the site. | Computed ratio. WCAG AA needs 4.5:1. | Use a darker WhatsApp green, `#0F7A55` (5.34:1). Keep the brand hue. |
| 3 | **Call button fails contrast: 3.68:1** (white on `#3B82F6`). It is also a loud second colour that competes with WhatsApp. | Computed. | Restyle as a secondary (outlined) button. WhatsApp is the primary channel. |
| 4 | **Danger red fails contrast: 3.76:1** (`#EF4444`) on the Delete button, error text and the Log Out item. | Computed. | Use `#DC2626` (4.83:1). |
| 5 | **Placeholder text is unreadable: 2.34:1** (gray-400 on the gray-100 search field). | Computed. The search box is the main entry point. | Use gray-500 placeholders. |
| 6 | **Hero carousel auto-advances every 2 seconds with no pause control**, except mouse hover, which does not exist on phones. This fails WCAG 2.2.2 (Pause, Stop, Hide, Level A). The dots are `<span>`s, so they cannot be reached by keyboard. | `setupLeaningCarousel`, `setInterval(…, 2000)`. | Remove the rotation. NN/g's carousel research finds that users ignore rotating heroes as "ads", and recommends not auto-forwarding on mobile at all. |
| 7 | **Card text is 9–10px on mobile.** The probe found 24 elements at 10px and 8 at 9px on the home page. The seller name truncates to "Kwame M…" and "just now" wraps onto two lines. The title is 12px and cut to one line. | Probe output and screenshots. | Show a 14px title clamped to 2 lines and a 16px price. Replace the meta row with one 12px line: room and time. |

### P1 — Significant friction

| # | Finding | Fix |
|---|---|---|
| 8 | **No search on mobile.** It is hidden inside the hamburger menu, yet search is the main way people buy on a marketplace. | Put a search bar in the mobile hero, and keep the one already on the products page. |
| 9 | **The mobile fold is all marketing.** It shows the headline, two stacked CTAs, stats and a ~370px stock-photo carousel. Real listings start around y ≈ 1,000px. | Compact the hero to a headline, search and CTAs. Hide the showcase on mobile, and on desktop show it as a static decorative pair. Move categories up as a tappable grid. |
| 10 | **Showcase images look like real listings but aren't.** "MacBook Air M2", "Room 315" and similar link to category pages that are empty today. That breaks trust on the first tap. | Make the showcase decorative (`aria-hidden`, not links). |
| 11 | **"0 Products · 0 Sellers" is shown as social proof.** It also reads "0" before the counts load. | Hide each stat until it has loaded and is above zero. |
| 12 | **The empty state is a dead end.** On the products page, "No products found" offers "Browse All Products", which reloads the same unfiltered empty list. | With filters active, offer "Clear filters". With no listings at all, invite the visitor to post the first one. |
| 13 | **On product detail (mobile), the contact buttons scroll away.** On a long description the user has to scroll back up to act. | Add a sticky bottom contact bar on mobile. Published sticky-CTA tests report clear uplifts, for example +25% sales in Conversion Rate Experts' test. |
| 14 | **The seller card is invisible**: gray-50 on a gray-50 page. | Give it a white background and a border. |
| 15 | **Gallery arrows are `opacity: 0` until hover**, so they never appear on touch devices. | Always show them on `(hover: none)` devices. |
| 16 | **Prices read as "GH₵ 6400.00".** There is no thousands separator, and the ".00" adds noise to every card. | Show "GH₵ 6,400". Keep two decimals only when the price has pesewas. |
| 17 | **Tap targets are below 44px.** Measured sizes: navbar Log In 66×28, hamburger 38×37, "View All" 102×31, footer links 17px tall. They pass WCAG 2.5.8's 24px minimum but fall short of the 44px platform guidance. | Make navbar controls 40–44px and pad the footer links. |
| 18 | **Logged-in mobile users have no visible "Sell" button.** It is only in the menu. | Show a compact Sell button in the mobile navbar. |
| 19 | **Seller descriptions lose their line breaks.** | Add `white-space: pre-line` to the description. |

### P2 — Polish

| # | Finding | Fix |
|---|---|---|
| 20 | **Signup has uneven vertical rhythm on mobile.** When `.form-row` stacks, its grid gap adds to the field margin, so the spacing jumps from 20px to 36px. | Set `row-gap: 0` on `.form-row`. |
| 21 | **"How It Works" takes ~1,000px on mobile.** It shows three tall cards, each with an icon *and* a step number. | Use compact horizontal rows on mobile. |
| 22 | **The theme colour is inconsistent.** The manifest uses `#FF5A36` and the HTML uses `#BA4024`. | Use `#BA4024` in both. |
| 23 | **Input borders are 1.23:1 against white** (WCAG 1.4.11 asks for 3:1 for control boundaries). | Use a darker border (`#8494A9`, 3.09:1). |
| 24 | **Toasts sit top-right over the sticky navbar on phones.** | Show them full-width at the bottom on small screens. |
| 25 | **The section rhythm on home is uneven**: a 48px gap above categories and a 96px gap around "How it works". | Use consistent section spacing. |

### Not changed (recommend separately)

- **Password show/hide toggle** on login and signup. This is a common mobile request.
- **A signup form of 8 fields** before anyone can browse-and-contact. Consider letting buyers browse without an account (they already can) and asking for room and WhatsApp only when someone first lists an item.
- **Favourites UI.** The schema supports it, but there is no UI yet.
- **Real product data.** The live database is empty. Seeding a handful of real listings before launch will do more for perceived quality than any styling change.

---

## Round 2 — app-like refresh

The app-like refresh was chosen over a polish-only pass or a new visual identity. The terracotta brand, fonts and icons are kept.

| Area | Change |
|---|---|
| Mobile shell | A bottom tab bar (Home, Browse, Sell, Account) replaces the hamburger menu. It is hidden on login/signup, the product page and the listing form. The mobile footer shrinks to a one-line sign-off. |
| Browsing | Search, a Filters button and the category pills stay pinned under the navbar on phones. Condition and sort open in a bottom sheet. Card photos are square on phones. |
| Auth | Password fields have a show/hide toggle. Signup is two steps: **Account** (name, email, password), then **Contact** (room, phone, "I use this number on WhatsApp"). The confirm-password field is gone, because the toggle lets people check what they typed. On phones the forms are full-screen. |
| Seller dashboard | Greeting header, compact stat tiles, and one listing list for all screen sizes with Edit / Mark sold / Relist / Delete. A new Account section holds the Admin panel and Log out links. |
| Listing form | Grouped into Photos, Details and Price & condition cards. On phones the Publish button stays pinned to the bottom. |
| Admin | Tabs become a segmented control, and stat tiles are compact. |

These pre-existing bugs were found and fixed along the way:
- Dashboard and admin mobile cards showed full-size photos overflowing the screen, because `.thumb` was only sized inside the desktop table.
- Admin category bars never showed their fill: the fill is an inline `<span>`, so its width was ignored.
- Success-green text was 2.5:1 against white. It is now `#047857`, at 5.48:1.

Still open:
- The favourites UI.
- Real listings in the database.

## Round 3 — "Classifieds" visual identity

Four directions were mocked up in `mockups/`:
- "Down the Hall": rejected as looking AI-generated.
- A, Classifieds.
- B, Community feed.
- C, Classifieds with fewer lines.

C was chosen, with slightly rounded corners, and applied to the whole app. Everything from rounds 1 and 2 still works the same way. Only the look changed.

| Area | Change |
|---|---|
| Palette | Paper `#F3F0E8`, ink `#141414`, and one spot colour taken from the building's orange-red panels. Buttons and small text use `#BF3A20`, which passes AA (4.80:1 on paper, 5.47:1 with white text). The brighter `#D2462A` is kept for large display type. The grey scale is now warm-toned, and the error red and success green were darkened to pass on paper. |
| Type | Archivo condensed for uppercase headlines, IBM Plex Sans for body text, IBM Plex Mono for prices, rooms and times. |
| Lines | Tinted panels and spacing replace borders and dividers. The admin table uses alternating row tints instead of rules. |
| Corners | 6px stamps, 12px buttons and photos, 20px panels. |
| Home | A big "SP MARKET" masthead, a filled search field, a single line of categories with live counts, and the hostel photo with a caption. The newest listing runs as the lead story, the next six sit in a 3-column grid, then a "List it free." block. |
| Cards | An open layout with no box: a typewriter line with the condition and "Just in", the photo, the title, then price, room and age. Sold items get a grey photo, a struck-out price and a SOLD stamp. |
| Hostel photos | The building photo was converted to WebP: 60 KB on phones and 192 KB on desktop, down from 2.4 MB. It appears on the home page and the login/signup screens. The original JPGs are kept. |
| Auth | The hostel photo sits beside the form on desktop and above it as a banner on phones. |
| Other | The footer no longer shows Log In / Sign Up to people who are already logged in. The home page's "database not set up" message now works; it used to check the wrong property, so it never appeared. |

## Sources

- Baymard Institute, *Product List UX* research: [baymard.com/research/ecommerce-product-lists](https://baymard.com/research/ecommerce-product-lists) and [Product List UX 2025 pitfalls](https://baymard.com/research-articles/current-state-product-list-and-filtering). In 2025, 78% of mobile sites were rated poor or mediocre on product lists. The core tension Baymard describes is card information density versus screen space.
- NN/g carousel findings, as summarised by [Yale Usability](https://usability.yale.edu/usability-best-practices/hero-imagescarousels) and [Texas A&M](https://web.tamu.edu/?p=1845), plus the [NN/g carousels video](https://www.nngroup.com/videos/carousels-websites-mobile-apps/). The findings: users treat carousels as ads, auto-forwarding gives too little reading time, and carousels should not auto-forward on mobile.
- Conversion Rate Experts, [sticky CTA win report](https://conversion-rate-experts.com/sticky-cta-win-report/) (+25% sales from a sticky mobile button).
- WCAG 2.2: [2.5.8 Target Size (Minimum)](https://kb.daisy.org/publishing/docs/wcag/target-size-minimum.html) and [2.2.2 Pause, Stop, Hide](https://wcag.dock.codes/rewrite/en/wcag222).
