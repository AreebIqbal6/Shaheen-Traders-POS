const fs = require('fs');
const path = require('path');

const mappings = {
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-900',
  'bg-white': 'bg-white dark:bg-slate-800',
  'text-slate-900': 'text-slate-900 dark:text-slate-50',
  'text-slate-800': 'text-slate-800 dark:text-slate-200',
  'text-slate-700': 'text-slate-700 dark:text-slate-300',
  'text-slate-600': 'text-slate-600 dark:text-slate-400',
  'text-slate-500': 'text-slate-500 dark:text-slate-400',
  'border-slate-200': 'border-slate-200 dark:border-slate-700',
  'border-slate-100': 'border-slate-100 dark:border-slate-800',
  'border-slate-300': 'border-slate-300 dark:border-slate-600',
  'hover:bg-slate-50': 'hover:bg-slate-50 dark:hover:bg-slate-700',
  'hover:bg-slate-100': 'hover:bg-slate-100 dark:hover:bg-slate-700',
  'hover:bg-slate-200': 'hover:bg-slate-200 dark:hover:bg-slate-600',
  'focus:border-slate-900': 'focus:border-slate-900 dark:focus:border-slate-400',
  'focus:ring-slate-900': 'focus:ring-slate-900 dark:focus:ring-slate-400',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-900/30',
  'bg-green-50': 'bg-green-50 dark:bg-green-900/30',
  'bg-red-50': 'bg-red-50 dark:bg-red-900/30',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-green-600': 'text-green-600 dark:text-green-400',
  'text-red-600': 'text-red-600 dark:text-red-400',
  'bg-zinc-50': 'bg-zinc-50 dark:bg-zinc-900',
  'bg-slate-100': 'bg-slate-100 dark:bg-slate-700',
  'bg-slate-200': 'bg-slate-200 dark:bg-slate-600',
  'bg-slate-300': 'bg-slate-300 dark:bg-slate-500',
  'text-zinc-900': 'text-zinc-900 dark:text-zinc-50',
  'text-zinc-800': 'text-zinc-800 dark:text-zinc-200',
  'text-zinc-500': 'text-zinc-500 dark:text-zinc-400',
  'border-zinc-200': 'border-zinc-200 dark:border-zinc-700',
};

const processFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [light, darkPair] of Object.entries(mappings)) {
    // A bit more robust regex to only match inside className="..." or className={`...`}
    // Instead of doing full AST parsing, we just do string replacement with word boundaries.
    const regex = new RegExp(`(?<=className=[{""'\`].*?\\b)${light}(?=\\b.*?["'\`}])`, 'g');
    
    content = content.replace(regex, (match, offset, string) => {
      const line = string.substring(Math.max(0, offset - 50), Math.min(string.length, offset + 100));
      const darkClass = darkPair.split(' ')[1];
      if (line.includes(darkClass)) return match;
      return darkPair;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
};

const directories = ['src/views', 'src/components'];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      processFile(path.join(dirPath, file));
    }
  });
});

console.log('Done.');
