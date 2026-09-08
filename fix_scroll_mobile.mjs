import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /<Virtuoso\s+style=\{\{ height: '100%', width: '100%' \}\}/,
  '<Virtuoso\n                className="custom-scrollbar overflow-y-scroll"\n                style={{ height: \'100%\', width: \'100%\' }}'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
