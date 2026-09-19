import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all products...');
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  if (!products) {
    console.log('No products found.');
    return;
  }

  console.log(`Found ${products.length} products. Updating...`);

  let count = 1;
  for (const p of products) {
    const expectedSku = count.toString().padStart(4, '0');
    
    // We update stock to 50 and SKU to expected sequence
    const { error: updateErr } = await supabase
      .from('products')
      .update({ 
        sku: expectedSku,
        stock: 50
      })
      .eq('id', p.id);
      
    if (updateErr) {
      console.error(`Error updating product ${p.id}:`, updateErr);
    } else {
      console.log(`Updated product: ${p.name} -> SKU: ${expectedSku}, Stock: 50`);
    }
    count++;
  }

  console.log('Finished updating products.');
}

run();
