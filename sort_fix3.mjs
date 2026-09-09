import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

const regex = /const filteredProducts = products\.filter\([\s\S]*?return matchSearch && matchFilter;\n\s*\}\);/;
const replacement = `const filteredProducts = products.filter(p => {
      const safeName = p.name || '';
      const safeBarcode = p.barcode || '';
      const matchSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || safeBarcode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = currentFilter === 'all' || 
                          (currentFilter === 'critical' && p.stock <= 2) || 
                          (currentFilter === 'low' && p.stock <= 10) ||
                          (currentFilter === 'local' && p.item_type !== 'Imported') ||
                          (currentFilter === 'imported' && p.item_type === 'Imported');
      return matchSearch && matchFilter;
    }).sort((a, b) => {
      const aSku = parseInt(a.sku || '0', 10) || 0;
      const bSku = parseInt(b.sku || '0', 10) || 0;
      return aSku - bSku;
    });`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/views/ProductsView.tsx', content);
