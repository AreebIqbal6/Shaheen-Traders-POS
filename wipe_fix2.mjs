import fs from 'fs';
let content = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

content = content.replace(
  /const \{ error: orderErr \} = await supabase\.from\('orders'\)\.delete\(\)\.not\('id', 'is', null\);\s*/,
  `const { error: orderErr } = await supabase.from('orders').delete().not('id', 'is', null);\n                const { error: shopErr } = await supabase.from('shops').delete().not('id', 'is', null);\n\n`
);

content = content.replace(
  /if \(prodErr \|\| bookErr \|\| orderErr\)/,
  `if (prodErr || bookErr || orderErr || shopErr)`
);

content = content.replace(
  /prodErr && 'Products', bookErr && 'Bookers', orderErr && 'Orders'/,
  `prodErr && 'Products', bookErr && 'Bookers', orderErr && 'Orders', shopErr && 'Shops'`
);

fs.writeFileSync('src/views/SettingsView.tsx', content);
