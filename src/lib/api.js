import { supabase } from '../supabase.js';
import { SORT_OPTIONS, PAGE_SIZE } from './constants.js';

/**
 * Columns selected for grid/card views — joins the seller's public fields.
 */
const CARD_SELECT = '*, profiles!seller_id(full_name, avatar_url, room_number)';

/**
 * Escape PostgREST `or()` filter metacharacters in a user-supplied search term.
 * Commas split filter clauses and parens group them, so both must go.
 * @param {string} term
 * @returns {string}
 */
export function sanitizeSearchTerm(term) {
  return String(term ?? '')
    .replace(/[,()\\]/g, ' ')
    .replace(/%/g, '')
    .trim();
}

/**
 * Resolve a sort id into its Supabase column + direction.
 * Falls back to "newest" for unknown ids.
 * @param {string} sortId
 * @returns {{column: string, ascending: boolean}}
 */
export function resolveSort(sortId) {
  const option = SORT_OPTIONS.find((s) => s.id === sortId) || SORT_OPTIONS[0];
  return { column: option.column, ascending: option.ascending };
}

/**
 * Translate a page number into a Supabase inclusive range.
 * @param {number} page - zero-based page index
 * @param {number} [pageSize]
 * @returns {{from: number, to: number}}
 */
export function pageRange(page, pageSize = PAGE_SIZE) {
  const from = page * pageSize;
  return { from, to: from + pageSize - 1 };
}

/**
 * Apply the listing filters to a Supabase query builder.
 * Split out from fetchProducts so the filter logic can be tested
 * against a stub builder without a network call.
 * @param {Object} query - Supabase query builder
 * @param {Object} filters - { q, category, condition, minPrice, maxPrice, sort }
 * @param {number} page
 * @returns {Object} the query builder
 */
export function applyProductFilters(query, filters = {}, page = 0) {
  const term = sanitizeSearchTerm(filters.q);
  if (term) {
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.condition && filters.condition !== 'all') {
    query = query.eq('condition', filters.condition);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== '' && filters.minPrice !== null) {
    query = query.gte('price', Number(filters.minPrice));
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== '' && filters.maxPrice !== null) {
    query = query.lte('price', Number(filters.maxPrice));
  }

  const { column, ascending } = resolveSort(filters.sort);
  query = query.order(column, { ascending });

  const { from, to } = pageRange(page);
  return query.range(from, to);
}

/**
 * Fetch a page of public products matching the given filters.
 * @param {Object} filters
 * @param {number} page - zero-based
 * @returns {Promise<{products: Array, count: number, error: string|null}>}
 */
export async function fetchProducts(filters = {}, page = 0) {
  let query = supabase
    .from('products')
    .select(CARD_SELECT, { count: 'exact' })
    .eq('status', 'available')
    .eq('is_flagged', false);

  query = applyProductFilters(query, filters, page);

  const { data, count, error } = await query;
  if (error) return { products: [], count: 0, error: error.message };
  return { products: data || [], count: count || 0, error: null };
}

/**
 * Fetch the latest available listings for the landing page.
 * @param {number} limit
 */
export async function fetchLatestProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('status', 'available')
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { products: [], error: error.message };
  return { products: data || [], error: null };
}

/**
 * Marketplace-wide counts for the landing page hero.
 */
export async function fetchMarketplaceStats() {
  const [products, sellers] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
      .eq('is_flagged', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  return {
    products: products.count || 0,
    sellers: sellers.count || 0,
    error: products.error?.message || sellers.error?.message || null,
  };
}

/**
 * Fetch a single product with the full seller profile joined.
 * @param {string} id
 */
export async function fetchProduct(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(*)')
    .eq('id', id)
    .single();

  if (error) return { product: null, error: error.message };
  return { product: data, error: null };
}

/**
 * Increment a product's view counter. Fire-and-forget — a failure here
 * must never block rendering the page.
 * @param {string} id
 * @param {number} currentCount
 */
export function incrementViews(id, currentCount) {
  // A misconfigured client can throw synchronously from .from(), which would
  // otherwise bubble up and blank a product page that loaded perfectly well.
  try {
    return Promise.resolve(
      supabase
        .from('products')
        .update({ views_count: (currentCount || 0) + 1 })
        .eq('id', id)
    ).then(
      () => {},
      () => {}
    );
  } catch {
    return Promise.resolve();
  }
}

/**
 * Fetch products in the same category, excluding the one being viewed.
 */
export async function fetchRelatedProducts(category, excludeId, limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select(CARD_SELECT)
    .eq('category', category)
    .eq('status', 'available')
    .eq('is_flagged', false)
    .neq('id', excludeId)
    .limit(limit);

  if (error) return { products: [], error: error.message };
  return { products: data || [], error: null };
}

/**
 * Fetch every listing belonging to one seller (dashboard view).
 */
export async function fetchMyProducts(sellerId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) return { products: [], error: error.message };
  return { products: data || [], error: null };
}

/**
 * Derive the dashboard stat tiles from a seller's listings.
 * @param {Array} products
 * @returns {{total: number, available: number, sold: number, totalViews: number}}
 */
export function calculateSellerStats(products = []) {
  return {
    total: products.length,
    available: products.filter((p) => p.status === 'available').length,
    sold: products.filter((p) => p.status === 'sold').length,
    totalViews: products.reduce((sum, p) => sum + (p.views_count || 0), 0),
  };
}

/** Insert a new listing. */
export async function createProduct(product) {
  const { error } = await supabase.from('products').insert(product);
  return { error: error?.message || null };
}

/** Update a listing the current user owns. */
export async function updateProduct(id, sellerId, patch) {
  const { error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .eq('seller_id', sellerId);
  return { error: error?.message || null };
}

/** Toggle a listing between available and sold. */
export async function toggleProductStatus(id, sellerId, currentStatus) {
  const newStatus = currentStatus === 'available' ? 'sold' : 'available';
  const { error } = await updateProduct(id, sellerId, { status: newStatus });
  return { status: newStatus, error };
}

/** Delete a listing the current user owns. */
export async function deleteProduct(id, sellerId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', sellerId);
  return { error: error?.message || null };
}

/* ========================================
   ADMIN QUERIES
   ======================================== */

/** Every listing, with seller name — admin listings tab. */
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, profiles!seller_id(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) return { products: [], error: error.message };
  return { products: data || [], error: null };
}

/** Every registered user — admin users tab. */
export async function fetchAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { users: [], error: error.message };
  return { users: data || [], error: null };
}

/**
 * Compute the admin overview metrics from the full product and user lists.
 * Pure function — one fetch of each table feeds every stat card.
 * @param {Array} products
 * @param {Array} users
 * @param {Date} [now]
 */
export function calculateAdminStats(products = [], users = [], now = new Date()) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalListings: products.length,
    availableListings: products.filter((p) => p.status === 'available').length,
    soldListings: products.filter((p) => p.status === 'sold').length,
    totalSellers: users.length,
    totalViews: products.reduce((sum, p) => sum + (p.views_count || 0), 0),
    flaggedListings: products.filter((p) => p.is_flagged).length,
    bannedUsers: users.filter((u) => u.is_banned).length,
    newToday: products.filter((p) => new Date(p.created_at) >= todayStart).length,
  };
}

/**
 * Count products per category, with percentages, sorted high → low.
 * @param {Array} products
 * @returns {Array<{id: string, count: number, percent: number}>}
 */
export function calculateCategoryBreakdown(products = []) {
  const counts = new Map();
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) || 0) + 1);
  }

  const total = products.length;
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/** Flag or unflag a listing (admin only — enforced by RLS). */
export async function setProductFlag(id, flagged) {
  const { error } = await supabase
    .from('products')
    .update({ is_flagged: flagged })
    .eq('id', id);
  return { error: error?.message || null };
}

/** Delete any listing (admin only — enforced by RLS). */
export async function adminDeleteProductRow(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error: error?.message || null };
}

/** Ban or unban a user (admin only — enforced by RLS). */
export async function setUserBanned(userId, banned) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: banned })
    .eq('id', userId);
  return { error: error?.message || null };
}
