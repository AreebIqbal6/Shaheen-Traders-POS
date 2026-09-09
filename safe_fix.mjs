import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// 1. generateSKU logic
const oldGenerateSKU = `export const generateSKU = (name: string, barcode: string) => {
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
  return \`\${prefix}-\${suffix}\`;
};`;

const newGenerateSKU = `export const generateSKU = (name: string, barcode: string) => {
  return '-';
};

export const getNextSKU = (productsList: Product[]) => {
  if (!productsList || productsList.length === 0) return '0001';
  let max = 0;
  for (const p of productsList) {
    if (p.sku && /^\\d+$/.test(p.sku.trim())) {
      const num = parseInt(p.sku.trim(), 10);
      if (num > max) max = num;
    }
  }
  return (max + 1).toString().padStart(4, '0');
};`;
content = content.replace(oldGenerateSKU, newGenerateSKU);

// 2. handleOpenModal
const oldModal = `  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, minStock: minStockDict[product.id] ?? 5 });
    } else {
      setEditingProduct(null);
      setFormData({ barcode: '', name: '', price: 0, stock: 0, sku: '', minStock: 5 });
    }
    setIsModalOpen(true);
  };`;
const newModal = `  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, minStock: minStockDict[product.id] ?? 5 });
    } else {
      setEditingProduct(null);
      setFormData({ barcode: '', name: '', price: 0, stock: 0, sku: getNextSKU(products), minStock: 5 });
    }
    setIsModalOpen(true);
  };`;
content = content.replace(oldModal, newModal);

// 3. Remove Auto-Generate Button safely
content = content.replace(
  /\{!editingProduct && \(\s*<button\s*onClick=\{handleGenerateSKU\}\s*className="text-\[10px\][^"]*"[^>]*>\s*Auto-Generate\s*<\/button>\s*\)\}/g,
  ""
);

// 4. Disable SKU Input
const skuInputOld = `<input 
                    id="sku"
                    type="text" 
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    placeholder="Auto-generated if empty"
                  />`;
const skuInputNew = `<input 
                    id="sku"
                    type="text" 
                    disabled
                    readOnly
                    value={formData.sku || ''}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono opacity-60 cursor-not-allowed"
                    placeholder="Auto-generated"
                  />`;
content = content.replace(skuInputOld, skuInputNew);

// 5. CSV SKU generation
content = content.replace(
  /const sku = generateSKU\(name\?\.trim\(\) \|\| 'Product', barcode\?\.trim\(\) \|\| ''\);/g,
  "const sku = getNextSKU([...products, ...newProducts]);"
);
content = content.replace(
  /const sku = generateSKU\(name \|\| 'Product', barcode \|\| ''\);/g,
  "const sku = getNextSKU([...products, ...newProducts]);"
);

// 6. Sorting filteredProducts
const oldFilter = `  const filteredProducts = products.filter(p => {
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

const newFilter = `  const filteredProducts = products.filter(p => {
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

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('src/views/ProductsView.tsx', content);
