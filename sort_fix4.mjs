import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

const regex = /return matchSearch && matchFilter;\n  \}\);\n\n  const handleOpenModal/;
const replacement = `return matchSearch && matchFilter;\n  }).sort((a, b) => {\n    const aSku = parseInt(a.sku || '0', 10) || 0;\n    const bSku = parseInt(b.sku || '0', 10) || 0;\n    return aSku - bSku;\n  });\n\n  const handleOpenModal`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/views/ProductsView.tsx', content);
