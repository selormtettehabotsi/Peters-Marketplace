# Module 07 — Admin Panel

> **Status**: ✅ Complete  
> **Depends on**: Modules 00, 01, 02  
> **Estimated effort**: 2-3 hours  

---

## Objective

Build the admin panel where you (the marketplace owner) can moderate listings, manage users, view analytics, and maintain the marketplace. This page is only accessible to users with `role = 'admin'`. Protected by both client-side auth guard and server-side RLS policies.

---

## Page URL

`/admin` — requires authentication AND admin role.

---

## How to Set Yourself as Admin

After creating your account through the normal signup flow, run this SQL in the Supabase SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

---

## Page Layout

The admin panel has a **tab-based** layout:

```
┌──────────────────────────────────────────┐
│               NAVBAR                      │
├──────────────────────────────────────────┤
│  ADMIN PANEL                              │
│  "Marketplace Administration"             │
├──────────────────────────────────────────┤
│  TABS                                     │
│  [📊 Overview] [📦 Listings] [👥 Users]   │
├──────────────────────────────────────────┤
│                                           │
│  TAB CONTENT (changes per tab)            │
│                                           │
├──────────────────────────────────────────┤
│               FOOTER                      │
└──────────────────────────────────────────┘
```

---

## Tab 1: Overview (Analytics Dashboard)

Shows key metrics at a glance:

### Stats Grid

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Total     │ │ ✅ Available │ │ 🔴 Sold      │ │ 👥 Total     │
│ Listings     │ │ Listings     │ │ Listings     │ │ Sellers      │
│              │ │              │ │              │ │              │
│     124      │ │      89      │ │      35      │ │      42      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 👁 Total     │ │ 🚩 Flagged   │ │ 🚫 Banned    │ │ 📅 New Today │
│ Views        │ │ Listings     │ │ Users        │ │              │
│              │ │              │ │              │ │              │
│    2,456     │ │       3      │ │       1      │ │       7      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### Data Queries

```javascript
// Total listings
const { count: totalListings } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });

// Available listings
const { count: availableListings } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'available');

// Sold listings
const { count: soldListings } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'sold');

// Total sellers
const { count: totalSellers } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true });

// Total views
const { data: viewsData } = await supabase
  .from('products')
  .select('views_count');
const totalViews = viewsData?.reduce((sum, p) => sum + p.views_count, 0) || 0;

// Flagged listings
const { count: flaggedCount } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .eq('is_flagged', true);

// Banned users
const { count: bannedCount } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .eq('is_banned', true);

// New today
const today = new Date().toISOString().split('T')[0];
const { count: newToday } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', today);
```

### Category Breakdown

Show a simple breakdown of products per category:

```
🍕 Food & Snacks:    34  ████████████░░░░  (27%)
📱 Electronics:      28  ██████████░░░░░░  (23%)
📚 Books:            22  ████████░░░░░░░░  (18%)
👕 Clothing:         18  ██████░░░░░░░░░░  (15%)
✂️ Services:          12  ████░░░░░░░░░░░░  (10%)
📦 Others:            10  ███░░░░░░░░░░░░░  ( 8%)
```

CSS for the bar:
```css
.category-bar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.category-bar-fill {
  height: 8px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.category-bar-track {
  flex: 1;
  height: 8px;
  background-color: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}
```

---

## Tab 2: Listings Management

A table of ALL products with admin actions:

### Table Columns

| Column | Description |
|--------|-------------|
| Image | Small thumbnail |
| Title | Product title (linked to detail page) |
| Seller | Seller name |
| Price | GH₵ price |
| Category | Category name |
| Status | Available / Sold badge |
| Flagged | 🚩 if flagged |
| Created | Date created |
| Actions | Flag / Unflag, Delete |

### Filters

- **Status filter**: All / Available / Sold
- **Flagged filter**: All / Flagged Only
- **Search**: Search by title
- **Sort**: Newest / Oldest / Most Views

### Admin Actions on Listings

| Action | Button | Effect |
|--------|--------|--------|
| **Flag** | 🚩 Flag | Sets `is_flagged = true` — hides from public listing |
| **Unflag** | ✅ Unflag | Sets `is_flagged = false` — shows again |
| **Delete** | 🗑 Delete | Permanently deletes product + images/video from storage |
| **View** | 👁 View | Opens the product detail page in new tab |

```javascript
// Flag a product
async function flagProduct(productId) {
  await supabase
    .from('products')
    .update({ is_flagged: true })
    .eq('id', productId);
  showToast('Product flagged and hidden from marketplace', 'warning');
}

// Unflag a product
async function unflagProduct(productId) {
  await supabase
    .from('products')
    .update({ is_flagged: false })
    .eq('id', productId);
  showToast('Product unflagged and visible again', 'success');
}

// Delete (as admin — RLS allows admin to delete any)
async function adminDeleteProduct(productId) {
  const confirmed = await showConfirmModal(
    'Delete Listing',
    'This will permanently remove this product. This cannot be undone.'
  );
  if (!confirmed) return;
  
  // Delete storage files and product row
  // (same logic as seller delete in Module 06)
}
```

---

## Tab 3: User Management

A table of ALL registered users:

### Table Columns

| Column | Description |
|--------|-------------|
| Avatar | User avatar |
| Name | Full name |
| Email | Email address |
| Room | Room number |
| Role | Seller / Admin badge |
| Listings | Number of products listed |
| Banned | ✅ Active / 🚫 Banned |
| Joined | Registration date |
| Actions | Ban / Unban |

### Admin Actions on Users

| Action | Button | Effect |
|--------|--------|--------|
| **Ban** | 🚫 Ban | Sets `is_banned = true` — user can't create new listings |
| **Unban** | ✅ Unban | Sets `is_banned = false` — user can list again |
| **View Listings** | 📦 | Filters the Listings tab to show only this user's products |

```javascript
// Ban a user
async function banUser(userId) {
  const confirmed = await showConfirmModal(
    'Ban User',
    'This will prevent the user from creating new listings. Their existing listings will remain visible. Continue?'
  );
  if (!confirmed) return;
  
  // Admin needs a special RLS policy or use Supabase admin API
  // Option: Create a Supabase Edge Function for admin operations
  // OR: Add an admin-specific RLS policy on profiles
  await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId);
  
  showToast('User banned', 'warning');
}

// Unban a user
async function unbanUser(userId) {
  await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', userId);
  
  showToast('User unbanned', 'success');
}
```

**Important RLS addition** — Admins need to update other users' profiles:

```sql
-- Add to the SQL schema (run in Supabase SQL Editor)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Tab CSS

```css
.admin-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-gray-200);
  margin-bottom: var(--space-6);
}

.admin-tab {
  padding: var(--space-3) var(--space-6);
  font-size: var(--font-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-500);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}

.admin-tab:hover {
  color: var(--color-primary);
}

.admin-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* Admin table */
.admin-table {
  width: 100%;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.admin-table th {
  background-color: var(--color-gray-50);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--font-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gray-500);
  border-bottom: 1px solid var(--color-gray-200);
}

.admin-table td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-sm);
  border-bottom: 1px solid var(--color-gray-100);
  vertical-align: middle;
}

.admin-table tr:hover {
  background-color: var(--color-gray-50);
}

.admin-table .thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

/* Responsive: switch to card layout on mobile */
@media (max-width: 768px) {
  .admin-table { display: none; }
  .admin-cards { display: flex; flex-direction: column; gap: var(--space-3); }
}

@media (min-width: 769px) {
  .admin-cards { display: none; }
}
```

---

## Verification Checklist

After completing this module, verify:

- [ ] Admin panel is only accessible to users with `role = 'admin'`
- [ ] Non-admin users are redirected away from `/admin`
- [ ] Overview tab shows all 8 stat cards with correct numbers
- [ ] Category breakdown renders with bars
- [ ] Listings tab shows all products with filters and search
- [ ] Admin can flag/unflag listings
- [ ] Flagged products are hidden from the public product listing
- [ ] Admin can delete any product (including storage files)
- [ ] Users tab shows all registered users
- [ ] Admin can ban/unban users
- [ ] Banned users cannot create new listings
- [ ] Admin RLS policy allows admin to update profiles
- [ ] Tables are responsive (cards on mobile)

---

## Next Module

→ [Module 08: PWA & Performance](MODULE_08_PWA_PERFORMANCE.md)
