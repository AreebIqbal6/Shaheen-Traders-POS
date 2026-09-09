import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// Add computeItemKey to TableVirtuoso
content = content.replace(
  /<TableVirtuoso/,
  '<TableVirtuoso computeItemKey={(index, item) => item.id}'
);

// Add computeItemKey to Virtuoso
content = content.replace(
  /<Virtuoso\n/,
  '<Virtuoso computeItemKey={(index, item) => item.id}\n'
);

// Add table-fixed and border-collapse just to be extremely safe about layout calculations
content = content.replace(
  /className="w-full text-left text-\[13px\]"/g,
  'className="w-full text-left text-[13px] border-collapse"'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
