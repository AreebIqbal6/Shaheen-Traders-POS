const fs = require('fs');

// Fix OrderPreviewModal
const modalPath = 'src/components/OrderPreviewModal.tsx';
let m = fs.readFileSync(modalPath, 'utf8');
m = m.replace('                   Save Backup\n                 </button>\n               )}\n               \n               <button ', '                   Save Backup\n                 </button>\n               \n               <button ');
fs.writeFileSync(modalPath, m, 'utf8');

// Fix AdminPOSView.tsx
const adminPath = 'src/views/AdminPOSView.tsx';
let a = fs.readFileSync(adminPath, 'utf8');
// It complains about `1922: }` Unexpected token
// Let's count how many `{` and `}` are in the file to see if they match, or just remove the last `}`.
const openCount = (a.match(/\{/g) || []).length;
const closeCount = (a.match(/\}/g) || []).length;

console.log("Admin open {:", openCount, "close }:", closeCount);
if (closeCount > openCount) {
  a = a.replace(/}\s*$/, '');
  fs.writeFileSync(adminPath, a, 'utf8');
  console.log("Removed trailing }");
}
