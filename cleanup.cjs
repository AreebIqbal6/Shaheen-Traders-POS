const fs = require('fs');
let content = fs.readFileSync('src/mockData.ts', 'utf8');
content = content.replace(/,\s*"expiryDate":\s*"[^"]*"/g, '');
content = content.replace(/"expiryDate":\s*"[^"]*",?\s*/g, '');
fs.writeFileSync('src/mockData.ts', content);
