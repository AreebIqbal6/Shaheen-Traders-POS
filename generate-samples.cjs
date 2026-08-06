const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = 'C:/Users/Noman Traders/Downloads';

// ─── Sample product data ─────────────────────────────────
const sampleProducts = [
  ['8901030818790', 'Lux Soft Touch Bar Soap 100g', 85, 150],
  ['8901030818806', 'Lux Velvet Touch Bar Soap 100g', 85, 120],
  ['8964000515044', 'Shan Biryani Masala 50g', 95, 200],
  ['8964000515051', 'Shan Karahi Masala 50g', 95, 180],
  ['8964000515068', 'Shan Nihari Masala 65g', 110, 90],
  ['8901491502016', 'Dettol Original Soap 130g', 160, 75],
  ['8901491502023', 'Dettol Skincare Soap 130g', 160, 60],
  ['8964001820055', 'National Tomato Ketchup 400g', 250, 110],
  ['8964001820062', 'National Chilli Garlic Sauce 400g', 280, 85],
  ['8964001820079', 'National Mixed Pickle 400g', 320, 95],
  ['6281006850019', 'Al-Areej Rose Water 200ml', 190, 55],
  ['8901396312345', 'Parachute Coconut Oil 200ml', 350, 130],
  ['8964000312001', 'Tapal Danedar Tea 200g', 420, 200],
  ['8964000312018', 'Tapal Family Mixture Tea 200g', 380, 175],
  ['8901030712345', 'Surf Excel Washing Powder 500g', 290, 140],
  ['8901030712352', 'Surf Excel Matic Top Load 500g', 340, 100],
  ['6281100043200', 'Nestle Everyday Milk Powder 375g', 580, 65],
  ['6281100043217', 'Nestle Nido Milk Powder 400g', 690, 80],
  ['8964001512345', 'Mitchell\'s Mango Jam 340g', 310, 70],
  ['8964001512352', 'Mitchell\'s Strawberry Jam 340g', 310, 55],
];

// ─── Create CSV ──────────────────────────────────────────
const csvHeader = 'barcode,name,price,stock';
const csvRows = sampleProducts.map(([barcode, name, price, stock]) =>
  `${barcode},${name},${price},${stock}`
);
const csvContent = [csvHeader, ...csvRows].join('\n');
const csvPath = path.join(outputDir, 'sample_import_products.csv');
fs.writeFileSync(csvPath, csvContent, 'utf-8');
console.log(`✅ CSV saved to: ${csvPath}`);

// ─── Create XLSX ─────────────────────────────────────────
const xlsxData = [
  ['barcode', 'name', 'price', 'stock'],  // header row
  ...sampleProducts,
];
const worksheet = xlsx.utils.aoa_to_sheet(xlsxData);

// Set column widths for readability
worksheet['!cols'] = [
  { wch: 18 },  // barcode
  { wch: 42 },  // name
  { wch: 10 },  // price
  { wch: 10 },  // stock
];

const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');
const xlsxPath = path.join(outputDir, 'sample_import_products.xlsx');
xlsx.writeFile(workbook, xlsxPath);
console.log(`✅ XLSX saved to: ${xlsxPath}`);

console.log(`\n📋 Both files contain ${sampleProducts.length} sample products ready for import.`);
