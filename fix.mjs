import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');
content = content.replace(
  /components=\{\{\r?\n\s*Table: \(\{ style, \.\.\.props \}\) => <table \{\.\.\.props\} style=\{\{ \.\.\.style, width: '100%' \}\} className="w-full text-left text-\[13px\]" \/>\r?\n\s*\}\}/,
  'components={{ Table: TableComponent }}'
);
fs.writeFileSync('src/views/ProductsView.tsx', content);
