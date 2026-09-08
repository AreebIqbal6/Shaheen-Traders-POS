import fs from 'fs';
const file = 'src/views/ProductsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<table className="hidden md:table w-full text-left text-\[13px\]">/,
  '<div className="hidden md:block flex-1 min-h-0">'
);
content = content.replace(
  /<\/table>\s*<div className="md:hidden flex flex-col h-full divide-y divide-slate-200 dark:divide-slate-700">/,
  '</div>\n            <div className="md:hidden flex flex-col h-full divide-y divide-slate-200 dark:divide-slate-700">'
);

// We also need to tell TableVirtuoso to use those classes for the actual table it renders!
content = content.replace(
  /<TableVirtuoso\s+style=\{\{ height: '100%', width: '100%' \}\}\s+data=\{filteredProducts\}/,
  `<TableVirtuoso
              style={{ height: '100%', width: '100%' }}
              data={filteredProducts}
              components={{
                Table: ({ style, ...props }) => <table {...props} style={{ ...style, width: '100%' }} className="w-full text-left text-[13px]" />
              }}`
);

fs.writeFileSync(file, content);
