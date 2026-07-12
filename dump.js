import fs from 'fs';
import path from 'path';

// Folders we DO NOT want to scan
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'target', 'public', 'assets'];
// File types we DO want to read
const ALLOWED_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html'];

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'codebase_for_ai.txt');

let treeOutput = 'PROJECT TREE:\n====================\n';
let codeOutput = '\n\nFILE CONTENTS:\n====================\n';

function walkDir(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach((file, index) => {
        if (IGNORE_DIRS.includes(file)) return;

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const isLast = index === files.length - 1;
        const marker = isLast ? '└── ' : '├── ';

        treeOutput += `${prefix}${marker}${file}\n`;

        if (stat.isDirectory()) {
            walkDir(fullPath, prefix + (isLast ? '    ' : '│   '));
        } else {
            const ext = path.extname(file);
            if (ALLOWED_EXTS.includes(ext)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // Get relative path for clean headers
                    const relativePath = path.relative(ROOT_DIR, fullPath);
                    codeOutput += `\n\n--- FILE: ${relativePath} ---\n\`\`\`${ext.substring(1)}\n${content}\n\`\`\`\n`;
                } catch (err) {
                    console.error(`Could not read ${file}`);
                }
            }
        }
    });
}

console.log('Generating AI Context Dump...');
walkDir(ROOT_DIR);
fs.writeFileSync(OUTPUT_FILE, treeOutput + codeOutput);
console.log(`Done! Saved to ${OUTPUT_FILE}`);