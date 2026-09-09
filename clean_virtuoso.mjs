import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// remove import { TableVirtuoso, Virtuoso } from 'react-virtuoso';
content = content.replace(/import \{ TableVirtuoso, Virtuoso \} from 'react-virtuoso';\r?\n/, '');

// remove TableComponent and virtuosoComponents
content = content.replace(/import \{ forwardRef \} from 'react';\r?\nconst TableComponent[\s\S]*?;\r?\nconst virtuosoComponents[\s\S]*?;\r?\n/, '');

fs.writeFileSync('src/views/ProductsView.tsx', content);
