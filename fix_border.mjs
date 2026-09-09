import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

content = content.replace(
  /className="w-full text-left text-\[13px\] border-collapse"/g,
  'className="w-full text-left text-[13px] border-separate border-spacing-0"'
);

// also catch if it was without border-collapse
content = content.replace(
  /className="w-full text-left text-\[13px\]"/g,
  'className="w-full text-left text-[13px] border-separate border-spacing-0"'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
