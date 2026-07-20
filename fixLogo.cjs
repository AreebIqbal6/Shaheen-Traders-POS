const fs = require('fs');
const files = [
  'src/components/Sidebar.tsx',
  'src/views/AdminPOSView.tsx',
  'src/views/AuthView.tsx',
  'src/views/B2BLoginView.tsx',
  'src/views/B2BShopView.tsx',
  'src/components/Receipt.tsx',
  'src/views/SettingsView.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace object-cover with object-contain mix-blend-multiply
  content = content.replace(/className=\"(.*?logo.*?)object-cover(.*?)\"/g, 'className=\"$1object-contain mix-blend-multiply$2\"');
  
  // Specifically target the logo tags
  content = content.replace(/<img src=\{logo\} alt=\"([^\"]+)\" className=\"([^\"]+)\" \/>/g, (match, alt, cls) => {
    if (!cls.includes('mix-blend-multiply')) {
       cls = cls.replace('object-cover', 'object-contain');
       if (!cls.includes('mix-blend-multiply')) cls += ' mix-blend-multiply';
    }
    return `<img src={logo} alt="${alt}" className="${cls}" />`;
  });

  content = content.replace(/<img src=\"\/logo_transparent\.png\" alt=\"([^\"]+)\" className=\"([^\"]+)\" \/>/g, (match, alt, cls) => {
    if (!cls.includes('mix-blend-multiply')) {
       cls = cls.replace('object-cover', 'object-contain');
       if (!cls.includes('mix-blend-multiply')) cls += ' mix-blend-multiply';
    }
    return `<img src="/logo_transparent.png" alt="${alt}" className="${cls}" />`;
  });

  fs.writeFileSync(file, content);
}
console.log('done');
