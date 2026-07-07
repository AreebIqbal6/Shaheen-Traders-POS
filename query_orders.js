import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const results = {};
  
  // 1. Try to fetch a single row to see what keys exist
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    results.sample_row = data;
    results.sample_error = error ? error.message : null;
  } catch (e) {
    results.sample_exception = e.message;
  }

  // 2. Try to query database columns
  const cols = ['contact_number', 'client_phone', 'phone', 'payment_terms', 'area', 'booker_name', 'client_name'];
  results.column_checks = {};
  for (const col of cols) {
    try {
      const { data, error } = await supabase.from('orders').select(col).limit(1);
      results.column_checks[col] = {
        exists: !error,
        error: error ? error.message : null
      };
    } catch (e) {
      results.column_checks[col] = { exists: false, exception: e.message };
    }
  }

  fs.writeFileSync('db_columns.json', JSON.stringify(results, null, 2));
  console.log('Done!');
}

run();
