import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /<Virtuoso\s+className="custom-scrollbar overflow-y-scroll"/,
  '<Virtuoso computeItemKey={(index, item) => item.id}\n                  className="custom-scrollbar overflow-y-scroll"'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
