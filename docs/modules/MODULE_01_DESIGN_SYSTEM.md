# Module 01 — Design System

> **Status**: ✅ Complete  
> **Depends on**: Module 00 (Project Setup)  
> **Estimated effort**: 1-2 hours  

---

## Objective

Create the complete CSS design system using CSS custom properties (variables). This includes the color palette (terracotta & cream from the hostel building), typography, spacing, component styles, animations, and utility classes. After this module, all visual building blocks are ready for any page.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `src/styles/variables.css` | All CSS custom properties (design tokens) |
| `src/styles/reset.css` | Browser reset / normalize |
| `src/styles/typography.css` | Font imports, heading styles, text classes |
| `src/styles/components.css` | Buttons, cards, badges, inputs, form elements |
| `src/styles/utilities.css` | Layout helpers, visibility, spacing shortcuts |
| `src/styles/animations.css` | Keyframes, transitions, skeleton loaders |
| `src/styles/index.css` | Master file that imports everything |

---

## Step-by-Step Instructions

### Step 1: Create `src/styles/variables.css`

This file defines ALL design tokens. Every color, size, and spacing value used anywhere in the app MUST reference these variables.

```css
:root {
  /* ========================================
     PRIMARY COLORS — Terracotta/Coral
     Source: St. Peter's Hostel building walls
     ======================================== */
  --color-primary: #D4553A;
  --color-primary-light: #E8745A;
  --color-primary-dark: #B33D25;
  --color-primary-50: #FDF2F0;
  --color-primary-100: #FADDD7;
  --color-primary-200: #F5B5A8;
  --color-primary-900: #6B2114;

  /* ========================================
     SECONDARY COLORS — Warm Cream
     Source: St. Peter's Hostel building columns
     ======================================== */
  --color-secondary: #E8E0D8;
  --color-secondary-light: #F2EDE8;
  --color-secondary-dark: #C4B8AB;

  /* ========================================
     ACCENT — Amber/Gold
     For prices, CTAs, important highlights
     ======================================== */
  --color-accent: #F59E0B;
  --color-accent-light: #FCD34D;
  --color-accent-dark: #D97706;

  /* ========================================
     NEUTRALS
     ======================================== */
  --color-white: #FFFFFF;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* ========================================
     SEMANTIC COLORS
     ======================================== */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-danger: #EF4444;
  --color-danger-light: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-light: #DBEAFE;

  /* ========================================
     TYPOGRAPHY
     ======================================== */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --font-xs: 0.75rem;
  --font-sm: 0.875rem;
  --font-base: 1rem;
  --font-lg: 1.125rem;
  --font-xl: 1.25rem;
  --font-2xl: 1.5rem;
  --font-3xl: 1.875rem;
  --font-4xl: 2.25rem;
  --font-5xl: 3rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* ========================================
     SPACING
     ======================================== */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* ========================================
     BORDER RADIUS
     ======================================== */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* ========================================
     SHADOWS
     ======================================== */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  /* ========================================
     TRANSITIONS
     ======================================== */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* ========================================
     Z-INDEX SCALE
     ======================================== */
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-navbar: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-toast: 60;

  /* ========================================
     LAYOUT
     ======================================== */
  --container-max: 1200px;
  --container-padding: var(--space-4);
  --navbar-height: 64px;
  
  /* Product grid */
  --grid-gap: var(--space-4);
  --card-min-width: 260px;
}

/* Responsive overrides */
@media (min-width: 768px) {
  :root {
    --container-padding: var(--space-8);
  }
}
```

### Step 2: Create `src/styles/reset.css`

```css
/* ========================================
   CSS Reset — Modern Normalize
   ======================================== */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  font-family: var(--font-body);
  font-size: var(--font-base);
  line-height: var(--leading-normal);
  color: var(--color-gray-900);
  background-color: var(--color-gray-50);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
  height: auto;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}

a {
  color: inherit;
  text-decoration: none;
}

ul,
ol {
  list-style: none;
}

table {
  border-collapse: collapse;
}

/* Remove default focus outline, add custom later */
:focus {
  outline: none;
}

/* Accessible focus for keyboard users */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Smooth scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-gray-100);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gray-400);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-500);
}
```

### Step 3: Create `src/styles/typography.css`

```css
/* ========================================
   Typography
   ======================================== */

/* Headings — Outfit font */
h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6 {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-tight);
  color: var(--color-gray-900);
}

h1, .h1 { font-size: var(--font-4xl); }
h2, .h2 { font-size: var(--font-3xl); }
h3, .h3 { font-size: var(--font-2xl); }
h4, .h4 { font-size: var(--font-xl); }
h5, .h5 { font-size: var(--font-lg); }
h6, .h6 { font-size: var(--font-base); }

/* Responsive headings */
@media (max-width: 768px) {
  h1, .h1 { font-size: var(--font-3xl); }
  h2, .h2 { font-size: var(--font-2xl); }
  h3, .h3 { font-size: var(--font-xl); }
}

/* Body text */
p {
  margin-bottom: var(--space-4);
  line-height: var(--leading-relaxed);
}

.text-xs { font-size: var(--font-xs); }
.text-sm { font-size: var(--font-sm); }
.text-base { font-size: var(--font-base); }
.text-lg { font-size: var(--font-lg); }
.text-xl { font-size: var(--font-xl); }
.text-2xl { font-size: var(--font-2xl); }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }

/* Text colors */
.text-primary { color: var(--color-primary); }
.text-muted { color: var(--color-gray-500); }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.text-accent { color: var(--color-accent); }

/* Price styling — uses monospace for alignment */
.price {
  font-family: var(--font-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.price-lg {
  font-size: var(--font-2xl);
}

.price-sm {
  font-size: var(--font-sm);
}

/* Truncate text */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Step 4: Create `src/styles/components.css`

```css
/* ========================================
   Reusable Component Styles
   ======================================== */

/* ---- CONTAINER ---- */
.container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* ---- BUTTONS ---- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  font-family: var(--font-body);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
  cursor: pointer;
  border: 2px solid transparent;
  text-decoration: none;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.97);
}

/* Primary button — terracotta */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
}

/* Secondary button — outlined */
.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.btn-secondary:hover {
  background-color: var(--color-primary-50);
}

/* Accent button — gold (for CTAs) */
.btn-accent {
  background-color: var(--color-accent);
  color: var(--color-gray-900);
}

.btn-accent:hover {
  background-color: var(--color-accent-dark);
  color: var(--color-white);
}

/* WhatsApp button */
.btn-whatsapp {
  background-color: #25D366;
  color: var(--color-white);
}

.btn-whatsapp:hover {
  background-color: #1DA851;
}

/* Phone call button */
.btn-call {
  background-color: var(--color-info);
  color: var(--color-white);
}

.btn-call:hover {
  background-color: #2563EB;
}

/* Danger button */
.btn-danger {
  background-color: var(--color-danger);
  color: var(--color-white);
}

.btn-danger:hover {
  background-color: #DC2626;
}

/* Ghost button */
.btn-ghost {
  background-color: transparent;
  color: var(--color-gray-600);
}

.btn-ghost:hover {
  background-color: var(--color-gray-100);
}

/* Button sizes */
.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-xs);
}

.btn-lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-base);
}

.btn-full {
  width: 100%;
}

/* Disabled */
.btn:disabled,
.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Icon only button */
.btn-icon {
  padding: var(--space-2);
  border-radius: var(--radius-full);
}

/* ---- CARDS ---- */
.card {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--transition-base);
  border: 1px solid var(--color-gray-200);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-body {
  padding: var(--space-4);
}

.card-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background-color: var(--color-gray-100);
}

/* ---- PRODUCT CARD ---- */
.product-card {
  position: relative;
  cursor: pointer;
}

.product-card .card-image {
  position: relative;
}

.product-card .product-status {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
}

.product-card .product-favorite {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
}

.product-card .product-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.product-card .product-price {
  font-size: var(--font-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--space-2);
}

.product-card .product-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-xs);
  color: var(--color-gray-500);
}

/* ---- BADGES ---- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge-primary {
  background-color: var(--color-primary-100);
  color: var(--color-primary-900);
}

.badge-success {
  background-color: var(--color-success-light);
  color: #065F46;
}

.badge-warning {
  background-color: var(--color-warning-light);
  color: #92400E;
}

.badge-danger {
  background-color: var(--color-danger-light);
  color: #991B1B;
}

.badge-gray {
  background-color: var(--color-gray-100);
  color: var(--color-gray-600);
}

/* ---- FORM INPUTS ---- */
.form-group {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-700);
  margin-bottom: var(--space-2);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-base);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  background-color: var(--color-white);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-gray-400);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-error {
  font-size: var(--font-xs);
  color: var(--color-danger);
  margin-top: var(--space-1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: var(--color-danger);
}

/* ---- SEARCH BAR ---- */
.search-bar {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-bar .search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
}

.search-bar .form-input {
  padding-left: var(--space-12);
}

/* ---- CATEGORY PILLS ---- */
.pill-group {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-2);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pill-group::-webkit-scrollbar {
  display: none;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-full);
  border: 2px solid var(--color-gray-200);
  background-color: var(--color-white);
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  flex-shrink: 0;
}

.pill:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.pill.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

/* ---- AVATAR ---- */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  background-color: var(--color-secondary);
  border: 2px solid var(--color-white);
}

.avatar-sm { width: 32px; height: 32px; }
.avatar-lg { width: 56px; height: 56px; }
.avatar-xl { width: 80px; height: 80px; }

/* Placeholder avatar with initials */
.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary);
  color: var(--color-white);
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-sm);
}

/* ---- PRODUCT GRID ---- */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
  gap: var(--grid-gap);
}

/* ---- EMPTY STATE ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-4);
  text-align: center;
}

.empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.empty-state .empty-title {
  font-size: var(--font-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.empty-state .empty-description {
  color: var(--color-gray-500);
  margin-bottom: var(--space-6);
  max-width: 400px;
}

/* ---- DIVIDER ---- */
.divider {
  height: 1px;
  background-color: var(--color-gray-200);
  margin: var(--space-6) 0;
}

/* ---- TOAST NOTIFICATIONS ---- */
#toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--color-white);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid var(--color-info);
  animation: slideInRight var(--transition-base) ease-out;
}

.toast-success { border-left-color: var(--color-success); }
.toast-error { border-left-color: var(--color-danger); }
.toast-warning { border-left-color: var(--color-warning); }

/* ---- MODAL ---- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  animation: fadeIn var(--transition-fast) ease-out;
}

.modal {
  background-color: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: scaleIn var(--transition-base) ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-gray-200);
}

/* ---- OFFLINE BANNER ---- */
.offline-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-gray-800);
  color: var(--color-white);
  text-align: center;
  padding: var(--space-3);
  font-size: var(--font-sm);
  z-index: var(--z-toast);
  animation: slideUp var(--transition-base) ease-out;
}

/* ---- LOADING SPINNER ---- */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-full);
  animation: spin 0.6s linear infinite;
}

.spinner-sm { width: 16px; height: 16px; border-width: 2px; }
.spinner-lg { width: 40px; height: 40px; border-width: 4px; }
```

### Step 5: Create `src/styles/utilities.css`

```css
/* ========================================
   Utility Classes
   ======================================== */

/* ---- DISPLAY ---- */
.hidden { display: none !important; }
.block { display: block; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }

/* ---- FLEXBOX ---- */
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.flex-1 { flex: 1; }
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }

/* ---- SPACING ---- */
.mt-1 { margin-top: var(--space-1); }
.mt-2 { margin-top: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }
.mt-6 { margin-top: var(--space-6); }
.mt-8 { margin-top: var(--space-8); }
.mb-1 { margin-bottom: var(--space-1); }
.mb-2 { margin-bottom: var(--space-2); }
.mb-4 { margin-bottom: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }
.mb-8 { margin-bottom: var(--space-8); }
.mx-auto { margin-left: auto; margin-right: auto; }

.p-2 { padding: var(--space-2); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-2 { padding-top: var(--space-2); padding-bottom: var(--space-2); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }
.py-8 { padding-top: var(--space-8); padding-bottom: var(--space-8); }
.py-16 { padding-top: var(--space-16); padding-bottom: var(--space-16); }

/* ---- TEXT ALIGNMENT ---- */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* ---- SIZING ---- */
.w-full { width: 100%; }
.h-full { height: 100%; }
.min-h-screen { min-height: 100vh; }

/* ---- POSITION ---- */
.relative { position: relative; }
.absolute { position: absolute; }
.sticky { position: sticky; }
.fixed { position: fixed; }

/* ---- OVERFLOW ---- */
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-x-auto { overflow-x: auto; }

/* ---- CURSOR ---- */
.cursor-pointer { cursor: pointer; }

/* ---- RESPONSIVE: Hide on mobile / desktop ---- */
@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
}

@media (min-width: 769px) {
  .hide-desktop { display: none !important; }
}

/* ---- SECTION SPACING ---- */
.section {
  padding: var(--space-12) 0;
}

.section-sm {
  padding: var(--space-8) 0;
}

/* ---- PAGE HEADER ---- */
.page-header {
  margin-bottom: var(--space-8);
}

.page-header .page-title {
  margin-bottom: var(--space-2);
}

.page-header .page-subtitle {
  color: var(--color-gray-500);
  font-size: var(--font-lg);
}
```

### Step 6: Create `src/styles/animations.css`

```css
/* ========================================
   Animations & Transitions
   ======================================== */

/* ---- KEYFRAMES ---- */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}

/* ---- ANIMATION CLASSES ---- */
.animate-fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}

.animate-slide-up {
  animation: slideUp var(--transition-base) ease-out;
}

.animate-slide-down {
  animation: slideDown var(--transition-base) ease-out;
}

.animate-scale-in {
  animation: scaleIn var(--transition-base) ease-out;
}

.animate-bounce-in {
  animation: bounceIn 0.5s ease-out;
}

/* ---- SKELETON LOADER ---- */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200) 25%,
    var(--color-gray-100) 50%,
    var(--color-gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: var(--radius-md);
}

.skeleton-text {
  height: 1em;
  margin-bottom: var(--space-2);
}

.skeleton-text:last-child {
  width: 70%;
}

.skeleton-title {
  height: 1.5em;
  width: 60%;
  margin-bottom: var(--space-3);
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 4 / 3;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}

.skeleton-button {
  height: 40px;
  width: 120px;
  border-radius: var(--radius-lg);
}

/* ---- STAGGERED ANIMATION ---- */
/* Apply to children of a grid/list for staggered entry */
.stagger-children > * {
  animation: slideUp var(--transition-base) ease-out both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }
.stagger-children > *:nth-child(7) { animation-delay: 300ms; }
.stagger-children > *:nth-child(8) { animation-delay: 350ms; }

/* ---- IMAGE BLUR-UP ---- */
.blur-up {
  filter: blur(20px);
  transition: filter 0.5s ease-out;
}

.blur-up.loaded {
  filter: blur(0);
}

/* ---- REDUCE MOTION ---- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Step 7: Create `src/styles/index.css`

This is the master CSS file that imports everything in the correct order:

```css
/* ========================================
   St. Peter's Marketplace — Master Stylesheet
   Import order matters!
   ======================================== */

/* 1. Design tokens (variables) — must be first */
@import './variables.css';

/* 2. CSS Reset — normalize browser defaults */
@import './reset.css';

/* 3. Typography — font imports and text styles */
@import './typography.css';

/* 4. Component styles — buttons, cards, forms, etc. */
@import './components.css';

/* 5. Utility classes — layout helpers, spacing */
@import './utilities.css';

/* 6. Animations — keyframes, transitions, skeletons */
@import './animations.css';
```

---

## Verification Checklist

After completing this module, verify:

- [ ] All 7 CSS files exist in `src/styles/`
- [ ] `index.css` correctly imports all other CSS files
- [ ] Running `npm run dev` shows no CSS errors in console
- [ ] Terracotta color (`#D4553A`) is used as `--color-primary`
- [ ] Cream color (`#E8E0D8`) is used as `--color-secondary`
- [ ] Google Fonts (Outfit + Inter) are loading in `index.html`
- [ ] Skeleton loader animation (shimmer) works
- [ ] Test a button by adding `<button class="btn btn-primary">Test</button>` to verify styles

---

## Visual Reference

The design system creates this visual language:
- **Primary action**: Terracotta buttons with white text
- **Cards**: White with subtle shadow, round corners (`radius-xl`)
- **Category pills**: Rounded pills with terracotta active state
- **Prices**: Bold terracotta text with GH₵ symbol
- **Loading states**: Gray shimmer animation (skeleton loaders)
- **Contact buttons**: Green (WhatsApp) + Blue (Phone call)
- **Status badges**: Green (Available) / Red (Sold) / Amber (Fairly Used)

---

## Next Module

→ [Module 02: Authentication](MODULE_02_AUTHENTICATION.md)
