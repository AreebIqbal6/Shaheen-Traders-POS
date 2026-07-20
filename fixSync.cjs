const fs = require('fs');

// 1. Fix AdminPOSView.tsx
let adminCode = fs.readFileSync('src/views/AdminPOSView.tsx', 'utf-8');
const oldPull = `      setProducts(prev => {
        const localById = new Map(prev.map(p => [p.id, p]));
        const merged = [...prev];
        for (const cp of cloudProducts) {
          const hasRealSku = cp.sku && cp.sku !== cp.barcode && cp.sku.trim() !== '';
          const localProduct = localById.get(cp.id);
          const mapped = {
            ...cp,
            name: cp.name || localProduct?.name || 'Unknown Product',
            sku: hasRealSku ? cp.sku : (localProduct?.sku && localProduct.sku !== localProduct.barcode ? localProduct.sku : generateSKU(cp.name || 'Product', cp.barcode)),
            pcsPerBox: cp.pcs_per_box || cp.pcsPerBox || localProduct?.pcsPerBox || 12,
            boxPerCtn: cp.box_per_ctn || cp.boxPerCtn || localProduct?.boxPerCtn || 6
          };
          if (localById.has(cp.id)) {
            const idx = merged.findIndex(p => p.id === cp.id);
            if (idx !== -1) merged[idx] = { ...merged[idx], ...mapped };
          } else {
            merged.push(mapped);
          }
        }
        return merged;
      });`;
      
const newPull = `      setProducts(prev => {
        const cloudIds = new Set(cloudProducts.map(p => p.id));
        const localById = new Map(prev.map(p => [p.id, p]));
        const merged = [];
        
        // Keep offline creations
        for (const p of prev) {
           if (p.id.startsWith('temp-') && !cloudIds.has(p.id)) {
              merged.push(p);
           }
        }

        for (const cp of cloudProducts) {
          const hasRealSku = cp.sku && cp.sku !== cp.barcode && cp.sku.trim() !== '';
          const localProduct = localById.get(cp.id);
          const mapped = {
            ...cp,
            name: cp.name || localProduct?.name || 'Unknown Product',
            sku: hasRealSku ? cp.sku : (localProduct?.sku && localProduct.sku !== localProduct.barcode ? localProduct.sku : generateSKU(cp.name || 'Product', cp.barcode)),
            pcsPerBox: cp.pcs_per_box || cp.pcsPerBox || localProduct?.pcsPerBox || 12,
            boxPerCtn: cp.box_per_ctn || cp.boxPerCtn || localProduct?.boxPerCtn || 6
          };
          merged.push(mapped);
        }
        return merged;
      });`;
      
if (!adminCode.includes(oldPull)) { console.log('AdminPOSView oldPull not found!'); }
adminCode = adminCode.replace(oldPull, newPull);
fs.writeFileSync('src/views/AdminPOSView.tsx', adminCode);

// 2. Fix ProductsView.tsx
let prodCode = fs.readFileSync('src/views/ProductsView.tsx', 'utf-8');
const oldImportId = "id: Date.now().toString() + Math.random() + i,";
const newImportId = "id: 'temp-' + Date.now().toString() + Math.random() + i,";
if (!prodCode.includes(oldImportId)) { console.log('ProductsView oldImportId not found!'); }
prodCode = prodCode.replace(oldImportId, newImportId);
fs.writeFileSync('src/views/ProductsView.tsx', prodCode);

console.log('done');
