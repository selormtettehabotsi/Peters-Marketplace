import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read .env if present
let envUrl = '';
let envKey = '';

try {
  const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      envUrl = trimmed.split('=')[1]?.trim();
    } else if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      envKey = trimmed.split('=')[1]?.trim();
    } else if (trimmed.startsWith('SUPABASE_URL=')) {
      envUrl = envUrl || trimmed.split('=')[1]?.trim();
    } else if (trimmed.startsWith('SUPABASE_ANON_KEY=')) {
      envKey = envKey || trimmed.split('=')[1]?.trim();
    }
  }
} catch {
  // .env optional
}

const SUPABASE_URL =
  envUrl ||
  'https://cznylpvrjmnudieclbas.supabase.co';

const SUPABASE_ANON_KEY =
  envKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bnlscHZyam1udWRpZWNsYmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzU3NTAsImV4cCI6MjEwODI1MTc1MH0.PUpMck4daqiJs9RYRimPG5oAO8oyuD1_onudzcdp4Ug';

console.log('='.repeat(60));
console.log("  St. Peter's Marketplace — Supabase Database Diagnostic");
console.log('='.repeat(60));
console.log(`URL:      ${SUPABASE_URL}`);
console.log(`Anon Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 15) + '...' + SUPABASE_ANON_KEY.slice(-10) : '(empty)'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('placeholder')) {
  console.error('❌ Supabase credentials are missing or still placeholder.');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runCheck() {
  let issues = 0;

  // 1. Check Auth connection
  process.stdout.write('1. Checking Supabase Auth Connection... ');
  try {
    const { error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      console.log(`❌ FAILED: ${sessionError.message}`);
      issues++;
    } else {
      console.log('✅ Connected');
    }
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    issues++;
  }

  // 2. Check Tables
  console.log('\n2. Checking Database Tables:');
  const requiredTables = ['profiles', 'products', 'favorites'];
  const missingTables = [];

  for (const table of requiredTables) {
    process.stdout.write(`   - public.${table}: `);
    const { error } = await client.from(table).select('*').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('schema cache')) {
        console.log('❌ NOT FOUND (Table does not exist in database)');
        missingTables.push(table);
        issues++;
      } else {
        // Table exists, but maybe RLS or empty
        console.log(`⚠️  Error (${error.code || 'unknown'}): ${error.message}`);
      }
    } else {
      console.log('✅ Exists and queryable');
    }
  }

  // 3. Check Storage Buckets
  console.log('\n3. Checking Storage Buckets:');
  const requiredBuckets = ['product-images', 'product-videos', 'avatars'];
  const missingBuckets = [];

  for (const bucket of requiredBuckets) {
    process.stdout.write(`   - ${bucket}: `);
    try {
      const { data, error } = await client.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        if (error.statusCode === '404' || error.message?.includes('not found') || error.code === 'NoSuchBucket') {
          console.log('❌ MISSING');
          missingBuckets.push(bucket);
          issues++;
        } else {
          console.log(`⚠️  Warning: ${error.message}`);
        }
      } else {
        console.log('✅ Bucket exists & accessible');
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      missingBuckets.push(bucket);
      issues++;
    }
  }

  // Summary and Fix Instructions
  console.log('\n' + '='.repeat(60));
  if (issues === 0) {
    console.log('🎉 All database tables and storage buckets are connected & healthy!');
  } else {
    console.log(`⚠️  Found ${issues} issue(s) with your Supabase setup:\n`);

    if (missingTables.length > 0) {
      console.log('👉 ACTION REQUIRED TO FIX DATABASE TABLES:');
      console.log('   The database tables have not been created yet in your Supabase project.');
      console.log('   1. Open your Supabase Dashboard: https://supabase.com/dashboard');
      console.log('   2. Select project: "cznylpvrjmnudieclbas"');
      console.log('   3. In the left navigation, click "SQL Editor"');
      console.log('   4. Click "New Query"');
      console.log('   5. Open the file `supabase/schema.sql` from this workspace, copy all');
      console.log('      contents, paste them into the SQL Editor, and click "Run" (or Ctrl+Enter).');
      console.log('');
    }

    if (missingBuckets.length > 0) {
      console.log('👉 ACTION REQUIRED TO FIX STORAGE BUCKETS:');
      console.log('   1. In the Supabase Dashboard, click "Storage" in the left navigation.');
      console.log('   2. Click "New Bucket" and create each of the following (check "Public bucket"):');
      for (const b of missingBuckets) {
        console.log(`      - Name: "${b}", Public: ON`);
      }
      console.log('   3. Go to "SQL Editor", copy `supabase/storage-policies.sql`, and click "Run".');
      console.log('');
    }

    console.log('👉 AUTH SETTINGS RECOMMENDATION:');
    console.log('   To allow students to sign up and start browsing immediately without needing');
    console.log('   email verification:');
    console.log('   1. Go to Authentication → Providers → Email in your Supabase Dashboard');
    console.log('   2. Toggle OFF "Confirm email"');
    console.log('   3. Click "Save"');
  }
  console.log('='.repeat(60) + '\n');
}

runCheck();
