import fs from 'fs';
let content = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

content = content.replace(
  "const { error: prodErr } = await supabase.from('products').delete().not('id', 'is', null);",
  "// Removed per user request: const { error: prodErr } = await supabase.from('products').delete().not('id', 'is', null);"
);

content = content.replace(
  "if (prodErr || bookErr || orderErr || shopErr) {",
  "if (bookErr || orderErr || shopErr) {"
);

content = content.replace(
  "const failedTables = [prodErr && 'Products', bookErr && 'Bookers', orderErr && 'Orders', shopErr && 'Shops'].filter(Boolean).join(', ');",
  "const failedTables = [bookErr && 'Bookers', orderErr && 'Orders', shopErr && 'Shops'].filter(Boolean).join(', ');"
);

fs.writeFileSync('src/views/SettingsView.tsx', content);
