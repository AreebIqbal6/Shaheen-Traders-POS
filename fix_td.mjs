import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// Replace the flex class on td
content = content.replace(
  /<td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2 whitespace-normal break-words min-w-\[200px\]">/g,
  '<td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50 whitespace-normal break-words min-w-[200px]">'
);

fs.writeFileSync('src/views/ProductsView.tsx', content);
