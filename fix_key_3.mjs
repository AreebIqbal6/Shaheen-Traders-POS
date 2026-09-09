import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /computeItemKey=\{\(index, item\) => item\.id\}/g,
  'computeItemKey={(index, item) => item.id || index}'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
