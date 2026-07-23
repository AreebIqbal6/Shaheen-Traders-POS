import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xaukltifywuxuewdulfl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhdWtsdGlmeXd1eHVld2R1bGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjEyMDksImV4cCI6MjA5NzYzNzIwOX0.F3OLZeZuEuBl8AHV6pyc5Hx0j-wxObu1RwNQn3yCnxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);