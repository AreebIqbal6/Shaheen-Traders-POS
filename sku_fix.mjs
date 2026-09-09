import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// Replace the old `generateSKU` with the new one. 
// BUT WAIT, it needs access to products array. Or we can just calculate it directly.

const getNextSKUStr = `
export const generateSKU = (name: string, barcode: string) => {
  // This is a dummy fallback for other files that still use it.
  // Actually, we should just remove generateSKU from here and fix the other files to not use it, or let it return something generic.
  // But wait, if I keep generateSKU as a generic fallback, what should it return?
  // Let's just make it return '-' or '0000'.
  // Actually, other files use generateSKU to generate a missing SKU. If it's missing, it should just be empty or '-'.
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
};
`;

content = content.replace(/export const generateSKU = \([\s\S]*?prefix = 'PRD';\s*\n\s*\}/, getNextSKUStr);

// In handleOpenModal, set the SKU
const oldOpenModal = `  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, minStock: minStockDict[product.id] ?? 5 });
    } else {
      setEditingProduct(null);
      setFormData({ barcode: '', name: '', price: 0, stock: 0, sku: '', minStock: 5 });
    }
    setIsModalOpen(true);
  };`;

const newOpenModal = `  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, minStock: minStockDict[product.id] ?? 5 });
    } else {
      setEditingProduct(null);
      setFormData({ barcode: '', name: '', price: 0, stock: 0, sku: getNextSKU(products), minStock: 5 });
    }
    setIsModalOpen(true);
  };`;

content = content.replace(oldOpenModal, newOpenModal);

// In the Add/Edit form, disable SKU and remove Auto-Generate
const autoGenButtonRegex = /<button[\s\S]*?onClick=\{handleGenerateSKU\}[\s\S]*?>[\s\S]*?Auto-Generate[\s\S]*?<\/button>/;
content = content.replace(autoGenButtonRegex, '');

// Disable SKU input
content = content.replace(
  /id="sku"\s*type="text"/,
  'id="sku"\n                    type="text"\n                    disabled\n                    readOnly'
);

// In handleFileUpload (CSV imports)
// We need to change how SKU is assigned.
content = content.replace(
  /const sku = generateSKU\(name\?\.trim\(\) \|\| 'Product', barcode\?\.trim\(\) \|\| ''\);/g,
  'const sku = getNextSKU([...products, ...newProducts]);'
);

content = content.replace(
  /const sku = generateSKU\(name \|\| 'Product', barcode \|\| ''\);/g,
  'const sku = getNextSKU([...products, ...newProducts]);'
);

// Sort filteredProducts by SKU
content = content.replace(
  /const filteredProducts = products\.filter\(p => \{/,
  `const filteredProducts = products.filter(p => {`
);
// We need to add sorting at the end of the filter
content = content.replace(
  /return matchSearch && matchFilter;\n    \}\);/,
  `return matchSearch && matchFilter;\n    }).sort((a, b) => {
      const aSku = parseInt(a.sku || '0', 10) || 0;
      const bSku = parseInt(b.sku || '0', 10) || 0;
      return aSku - bSku;
    });`
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
