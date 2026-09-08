import fs from 'fs';
const file = 'src/views/ProductsView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /components=\{\{\s*Table: \(\{ style, \.\.\.props \} \)=> <table \{\.\.\.props\} style=\{\{ \.\.\.style, width: '100%' \}\} className="w-full text-left text-\[13px\]" \/>\s*\}\}/g,
  'components={{ Table: TableComponent }}'
);

// We need to inject TableComponent definition outside the main component.
// We'll put it right above ProductsView component declaration.
content = content.replace(
  /export default function ProductsView/,
  `import { forwardRef } from 'react';\nconst TableComponent = forwardRef((props, ref) => <table {...props} ref={ref} className="w-full text-left text-[13px]" style={{...props.style, width: '100%'}} />);\nexport default function ProductsView`
);

fs.writeFileSync(file, content);
