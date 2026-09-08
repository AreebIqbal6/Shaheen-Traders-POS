const fs = require('fs');
const files = ['src/components/Receipt.tsx', 'src/components/ReportReceipt.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/data\.clientName \|\| 'Walk-in'/g, "data.clientName || '-'");
  content = content.replace(/data\.area \|\| 'N\/A'/g, "data.area || '-'");
  content = content.replace(/data\.bookerName \|\| 'Self'/g, "data.bookerName || '-'");
  content = content.replace(/data\.contactNumber \|\| '-'/g, "data.contactNumber || '-'");
  fs.writeFileSync(file, content);
});
