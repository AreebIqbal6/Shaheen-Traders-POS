import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

const oldFilter = `    });

  const filteredProducts = products.filter(p => {
    const safeName = p.name || '';
    const safeBarcode = p.barcode || '';
    const matchSearch = safeName.toLowerCase().includes(searchQuery.toLowerCase()) || safeBarcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = currentFilter === 'all' || 
                        (currentFilter === 'critical' && p.stock <= 2) || 
                        (currentFilter === 'low' && p.stock <= 10) ||
                        (currentFilter === 'local' && p.item_type !== 'Imported') ||
                        (currentFilter === 'imported' && p.item_type === 'Imported');
    return matchSearch && matchFilter;
  });`;

const newFilter = `    });

  const filteredProducts = products.filter(p => {
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

// Try an exact string replace, but spaces might differ.
content = content.replace(
  /return matchSearch && matchFilter;\n  \}\);/g,
  `return matchSearch && matchFilter;\n  }).sort((a, b) => {\n    const aSku = parseInt(a.sku || '0', 10) || 0;\n    const bSku = parseInt(b.sku || '0', 10) || 0;\n    return aSku - bSku;\n  });`
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
