import fs from 'fs';

for (const file of ['src/components/Receipt.tsx', 'src/components/ReportReceipt.tsx']) {
  let content = fs.readFileSync(file, 'utf8');

  // Change Header
  content = content.replace(
    /GULBERG(\s*)[&bull;|•|·|\.](\s*)MAIN OUTLET(\s*)[&bull;|•|·|\.](\s*)([\d\|\s]+)/,
    'Ammar: 0335 1243494 $1•$2 Irfan: 0318 2345703'
  );

  // Another form of the header is with a pipe from previous changes:
  content = content.replace(
    /GULBERG(\s*)[&bull;|•|·|\.](\s*)MAIN OUTLET(\s*)[&bull;|•|·|\.](\s*)0318 2345703(\s*)\|(\s*)0335 1243494/,
    'Ammar: 0335 1243494 $1•$2 Irfan: 0318 2345703'
  );

  // Change ADDRESS: to AREA:
  content = content.replace(
    /<span className="font-bold">ADDRESS:<\/span>\s*(.*?)\s*<\/div>/,
    `<span className="font-bold">AREA:</span> {data.area || data.address || '-'} </div>`
  );

  // Or maybe it is structured differently:
  content = content.replace(
    /ADDRESS:<\/span> (\{[^}]+\})/,
    'AREA:</span> {data.area || data.address || \'-\'}'
  );

  content = content.replace(
    /ADDRESS:<\/span>\s*<span className="ml-1 text-slate-700">\{[^}]+\}<\/span>/,
    'AREA:</span> <span className="ml-1 text-slate-700">{data.area || data.address || \'-\'}</span>'
  );

  // Remove CONTACT NUMBER: completely from the receipt
  content = content.replace(
    /<div className="w-1\/2 mb-2 flex">[\s\S]*?<span className="font-bold">CONTACT NUMBER:<\/span>[\s\S]*?<\/div>/,
    ''
  );
  
  // Wait, looking at the UI, the fields are:
  // SHOP NAME: ...        ADDRESS: ...
  // DATE OF DELIVERY: ... BOOKER NAME: ...
  // CONTACT NUMBER: ...   ORDER ID: ...
  // If I remove contact number, maybe I should move ORDER ID to the left, or just leave an empty div for spacing.
  
  fs.writeFileSync(file, content);
}
