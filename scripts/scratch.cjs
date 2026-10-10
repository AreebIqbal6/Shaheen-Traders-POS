const fs = require('fs');

const content = fs.readFileSync('src/views/AdminPOSView.tsx', 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes("case 'Register':"));
const renderEndIndex = lines.findIndex((l, i) => i > startIndex && l === "  };");

console.log("Start:", startIndex);
console.log("Render End:", renderEndIndex);
