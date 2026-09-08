import fs from 'fs';
const file = 'src/views/ProductsView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the wrappers
content = content.replace(
  /<div className="flex-1 w-full">/,
  '<div className="flex-1 w-full relative">'
);

content = content.replace(
  /<div className="hidden md:block flex-1 min-h-0">/,
  '<div className="hidden md:block absolute inset-0">'
);

content = content.replace(
  /<div className="md:hidden flex flex-col h-full divide-y divide-slate-200 dark:divide-slate-700">/,
  '<div className="md:hidden absolute inset-0 flex flex-col divide-y divide-slate-200 dark:divide-slate-700">'
);

fs.writeFileSync(file, content);
