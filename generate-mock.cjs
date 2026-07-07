const fs = require('fs');

const adjectives = ['Premium', 'Fresh', 'Organic', 'Spicy', 'Sweet', 'Salted', 'Crunchy', 'Roasted', 'Classic', 'Diet'];
const nouns = ['Chips', 'Juice', 'Milk', 'Bread', 'Butter', 'Cheese', 'Yogurt', 'Cereal', 'Coffee', 'Tea', 'Biscuits', 'Chocolate'];
const brands = ['Nestle', 'Lays', 'National', 'Shan', 'Tapal', 'Olpers', 'Knorr', 'Dalda', 'Mitchells', 'Fauji'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const products = [];
for (let i = 1; i <= 500; i++) {
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  const name = `${brand} ${adj} ${noun}`;
  const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 12 digit barcode
  const price = getRandomInt(50, 2000);
  const stock = getRandomInt(0, 200);
  
  // Expiry date logic (some expired, some expiring soon, some long future, some no expiry)
  let expiryDate = '';
  const randExpiry = Math.random();
  if (randExpiry < 0.1) {
    // Expired (-1 to -10 days)
    const d = new Date();
    d.setDate(d.getDate() - getRandomInt(1, 10));
    expiryDate = d.toISOString().split('T')[0];
  } else if (randExpiry < 0.2) {
    // Expiring soon (1 to 3 days)
    const d = new Date();
    d.setDate(d.getDate() + getRandomInt(1, 3));
    expiryDate = d.toISOString().split('T')[0];
  } else if (randExpiry < 0.6) {
    // Future (10 to 365 days)
    const d = new Date();
    d.setDate(d.getDate() + getRandomInt(10, 365));
    expiryDate = d.toISOString().split('T')[0];
  } // remaining 40% have no expiry

  products.push({
    id: i.toString(),
    barcode,
    name,
    price,
    stock,
    expiryDate
  });
}

const fileContent = `// Auto-generated mock data
import type { Product } from './views/ProductsView';

export const mockProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync('src/mockData.ts', fileContent);
console.log('Successfully generated 500 mock products in src/mockData.ts');
