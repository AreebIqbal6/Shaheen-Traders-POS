require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const generateSKU = (name, barcode) => {
  const safeName = name || 'Product';
  const words = safeName.split(' ').filter(w => w.length > 0);
  let prefix = '';
  
  if (words.length >= 2) {
    prefix = (words[0].substring(0, 3) + words[1].substring(0, 3)).toUpperCase().replace(/[^A-Z]/g, 'X');
  } else if (words.length === 1) {
    prefix = words[0].substring(0, 6).toUpperCase().replace(/[^A-Z]/g, 'X');
  } else {
    prefix = 'PRD';
  }
  const suffix = barcode ? barcode.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}-${suffix}`;
}

async function main() {
  console.log('Fetching products missing SKUs...');
  
  let allProducts = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    // Select all columns to safely upsert
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(from, from + step - 1);
      
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    if (data.length === 0) break;
    
    allProducts.push(...data);
    from += step;
  }
  
  const productsToUpdate = allProducts.filter(p => !p.sku || p.sku.trim() === '');
  
  console.log(`Found ${productsToUpdate.length} products missing SKUs. Generating...`);
  
  if (productsToUpdate.length === 0) {
    console.log('All products already have SKUs.');
    return;
  }

  const updatedProducts = productsToUpdate.map(p => ({
    ...p,
    sku: generateSKU(p.name, p.barcode)
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
  
  console.log('All missing SKUs generated and updated successfully!');
}

main().catch(console.error);
