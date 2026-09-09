import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// Define virtuosoComponents outside
content = content.replace(
  /export default function ProductsView/,
  `const virtuosoComponents = { Table: TableComponent };\nexport default function ProductsView`
);

// Replace the inline object
content = content.replace(
  /components=\{\{\s*Table: TableComponent\s*\}\}/,
  'components={virtuosoComponents}'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
