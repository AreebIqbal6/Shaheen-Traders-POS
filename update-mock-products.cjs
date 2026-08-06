require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Fetching all products...');
  
  let allProducts = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, barcode')
      .range(from, from + step - 1);
      
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    if (data.length === 0) break;
    
    allProducts.push(...data);
    from += step;
  }
  
  console.log(`Fetched ${allProducts.length} products. Updating with mock data...`);
  
  const updatedProducts = allProducts.map(p => ({
    ...p,
    price: Math.floor(Math.random() * (1500 - 50 + 1)) + 50, // Rs 50 to 1500
    stock: Math.floor(Math.random() * (200 - 10 + 1)) + 10   // 10 to 200
  }));
  
  // Upsert in batches of 500
  for (let i = 0; i < updatedProducts.length; i += 500) {
    const batch = updatedProducts.slice(i, i + 500);
    const { error } = await supabase.from('products').upsert(batch);
    if (error) {
      console.error('Error upserting batch:', error.message);
      return;
    }
    console.log(`Upserted ${i + batch.length} / ${updatedProducts.length}`);
  }
  
  console.log('All products updated with mock stock and mock price successfully!');
}

main().catch(console.error);
