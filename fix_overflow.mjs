import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /className="custom-scrollbar overflow-y-scroll"/g,
  'className="custom-scrollbar overflow-y-scroll overflow-x-hidden"'
);

// We should also remove min-w-[200px] because we WANT the table to be able to shrink if necessary!
content = content.replace(
  /min-w-\[200px\]/g,
  ''
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
