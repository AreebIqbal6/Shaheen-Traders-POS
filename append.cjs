const fs = require('fs');
fs.appendFileSync('src/views/AdminPOSView.tsx', '\n}\n');
console.log('Appended }');
