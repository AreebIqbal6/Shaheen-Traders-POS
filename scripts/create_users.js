import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from the root of pos-app
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createUsers() {
  console.log('Starting user creation...');

  // 1. Create Admin
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin@shaheentraders.com',
    password: 'Password123!',
    options: {
      data: {
        name: 'Admin'
      }
    }
  });

  if (adminError) {
    console.error('Failed to create admin:', adminError.message);
  } else {
    console.log('Admin created successfully:', adminData.user?.email);
  }

  // 2. Create Booker (Generic)
  const { data: bookerData, error: bookerError } = await supabase.auth.signUp({
    email: 'booker@shaheentraders.com',
    password: 'Password123!',
    options: {
      data: {
        name: 'Generic Booker'
      }
    }
  });

  if (bookerError) {
    console.error('Failed to create booker:', bookerError.message);
  } else {
    console.log('Booker created successfully:', bookerData.user?.email);
  }

  console.log('\n--- IMPORTANT ---');
  console.log('If Email Confirmation is turned ON in your Supabase settings, these users will receive an email to confirm their account. If you want them to log in immediately without confirming, you must turn OFF "Confirm Email" in Supabase Auth settings.');
}

createUsers();
