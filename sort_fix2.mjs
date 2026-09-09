import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /const matchFilter = ([\s\S]*?)return matchSearch && matchFilter;\n    \}\);/g,
  `const matchFilter = $1return matchSearch && matchFilter;\n    }).sort((a, b) => {\n      const aSku = parseInt(a.sku || '0', 10) || 0;\n      const bSku = parseInt(b.sku || '0', 10) || 0;\n      return aSku - bSku;\n    });`
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
