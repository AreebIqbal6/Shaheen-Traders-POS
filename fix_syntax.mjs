import fs from 'fs';
let lines = fs.readFileSync('src/views/ProductsView.tsx', 'utf8').split('\n');

const toRemove = [
  "  const suffix = barcode ? barcode.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();",
  "  return `${prefix}-${suffix}`;",
  "};"
];

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const suffix = barcode ? barcode.slice(-4)") && lines[i+1].includes("return `${prefix}-${suffix}`;") && lines[i+2] === "};") {
    i += 2; // skip
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('src/views/ProductsView.tsx', newLines.join('\n'));
