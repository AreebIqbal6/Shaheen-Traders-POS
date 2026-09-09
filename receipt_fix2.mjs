import fs from 'fs';

for (const file of ['src/components/Receipt.tsx', 'src/components/ReportReceipt.tsx']) {
  let content = fs.readFileSync(file, 'utf8');

  // Change ADDRESS to AREA
  content = content.replace(
    /ADDRESS:</g,
    'AREA:<'
  );

  // Replace Header block
  const oldHeader = /<div className="text-\[9px\] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-3">[\s\S]*?<\/div>/g;
  const newHeader = `<div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-4">\n                     <span>Ammar: 0335 1243494</span>\n                     <span>&bull;</span>\n                     <span>Irfan: 0318 2345703</span>\n                    </div>`;
  content = content.replace(oldHeader, newHeader);

  // Remove CONTACT NUMBER block
  const contactNumberBlock = /<div className="flex gap-2">\s*<span className="font-bold text-slate-900 uppercase">CONTACT NUMBER:<\/span>\s*<span className="text-slate-700">\{data\.contactNumber \|\| '-'\}<\/span>\s*<\/div>/g;
  content = content.replace(contactNumberBlock, '<div></div>');

  fs.writeFileSync(file, content);
}
