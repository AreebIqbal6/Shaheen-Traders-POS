const fs = require('fs');
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');
const search = `components={{
                  Table: ({ style, ...props }) => <table {...props} style={{ ...style, width: '100%' }} className="w-full text-left text-[13px]" />
                }}`;
content = content.replace(search, 'components={{ Table: TableComponent }}');
fs.writeFileSync('src/views/ProductsView.tsx', content);
