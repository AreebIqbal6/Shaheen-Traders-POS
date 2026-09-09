import fs from 'fs';
let lines = fs.readFileSync('src/views/ProductsView.tsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes('const filteredProducts ='));
let endIdx = idx;
while (!lines[endIdx].includes('const handleOpenModal')) {
  endIdx++;
}

// Find the line with `});` just before `const handleOpenModal`
for (let i = endIdx - 1; i >= idx; i--) {
  if (lines[i].includes('});')) {
    lines[i] = lines[i].replace('});', `}).sort((a, b) => {
    const aSku = parseInt(a.sku || '0', 10) || 0;
    const bSku = parseInt(b.sku || '0', 10) || 0;
    return aSku - bSku;
  });`);
    break;
  }
}

fs.writeFileSync('src/views/ProductsView.tsx', lines.join('\n'));
