const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:/Users/Noman Traders/Downloads/Rashid Store - List.xlsx');
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
for(let i = 15; i < 20; i++) {
  console.log(`Row ${i} length: ${data[i].length}`);
  console.log(`Row ${i}:`, data[i]);
}
