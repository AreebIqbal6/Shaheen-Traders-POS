import fs from 'fs';
let content = fs.readFileSync('src/components/ShopsManagement.tsx', 'utf8');

// Remove Owner UI
const ownerUIRegex = /<div>\s*<label[\s\S]*?<User size=\{12\} \/> Owner[\s\S]*?<\/label>\s*<input value=\{ownerName\}[\s\S]*?\/>\s*<\/div>/;
content = content.replace(ownerUIRegex, '');

// Remove Contact Number UI
const contactUIRegex = /<div>\s*<label[\s\S]*?<Phone size=\{12\} \/> Contact Number[\s\S]*?<\/label>\s*<input value=\{contactNumber\}[\s\S]*?\/>\s*<\/div>/;
content = content.replace(contactUIRegex, '');

// Remove Owner display in table
const ownerDisplayRegex = /\{shop\.ownerName && \([\s\S]*?<User size=\{12\} \/> \{shop\.ownerName\}[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(ownerDisplayRegex, '');

// Remove Contact display in table
const contactDisplayRegex = /\{shop\.contactNumber && \([\s\S]*?<Phone size=\{12\} \/> \{shop\.contactNumber\}[\s\S]*?<\/div>\s*\)\}/;
content = content.replace(contactDisplayRegex, '');

fs.writeFileSync('src/components/ShopsManagement.tsx', content);
