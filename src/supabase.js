import { createClient } from '@supabase/supabase-js';

// Environment variables take precedence (e.g. from .env or deployment),
// falling back to hardcoded project credentials.
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://cznylpvrjmnudieclbas.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnlscHZyam1udWRpZWNsYmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzU3NTAsImV4cCI6MjEwODI1MTc1MH0.PUpMck4daqiJs9RYRimPG5oAO8oyuD1_onudzcdp4Ug';

/**
 * True until real project credentials are pasted above or in .env.
 * The UI uses this to show a "backend not configured" notice instead of
 * silently failing every fetch.
 */
export const isConfigured =
  Boolean(SUPABASE_URL) &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('YOUR_SUPABASE_URL') &&
  !SUPABASE_URL.includes('placeholder') &&
  Boolean(SUPABASE_ANON_KEY) &&
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
  SUPABASE_ANON_KEY !== 'placeholder-anon-key' &&
  SUPABASE_ANON_KEY.length > 20;

// createClient throws on a non-URL, so fall back to a syntactically valid
// placeholder host. Requests against it fail, which is the documented
// pre-configuration behaviour.
export const supabase = createClient(
  isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key'
);
