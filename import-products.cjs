require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  const workbook = xlsx.readFile('C:/Users/Noman Traders/Downloads/Rashid Store - List.xlsx');
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const products = [];
  
  for (let i = 16; i < data.length; i++) {
    const row = data[i];
    if (row && row.length >= 4 && row[3] && typeof row[3] === 'string' && row[3].trim() !== '') {
      const name = row[3].trim();
      
      // Skip irrelevant footer text
      if (name.includes('Grand Total') || name.includes('Page') || name.includes('Print Date')) continue;

      products.push({
        id: crypto.randomUUID(),
        name: name,
        price: 0,
        stock: 0,
        barcode: String(Date.now() + i) // generate unique numeric barcode
      });
    }
  }

  console.log(`Found ${products.length} products to insert.`);
  
  // Insert in batches of 100
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const { data: resData, error } = await supabase.from('products').insert(batch);
    if (error) {
      console.error('Error inserting batch:', error.message);
      return;
    }
    console.log(`Inserted ${i + batch.length} / ${products.length}`);
  }
  
  console.log('All products restored successfully!');
}

main().catch(console.error);
