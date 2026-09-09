import fs from 'fs';
let content = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');

const oldWipe = `                // 1. WIPE THE CLOUD (Deletes all rows safely)
                const { error: prodErr } = await supabase.from('products').delete().not('id', 'is', null);
                const { error: bookErr } = await supabase.from('bookers').delete().not('id', 'is', null); 
                const { error: orderErr } = await supabase.from('orders').delete().not('id', 'is', null);  

                // Check if ANY cloud deletion failed \u2014 abort before wiping local
                if (prodErr || bookErr || orderErr) {
                  const failedTables = [prodErr && 'Products', bookErr && 'Bookers', orderErr && 'Orders'].filter(Boolean).join(', ');
                  throw new Error(\`Cloud wipe failed for: \${failedTables}. Local data preserved.\`);
                }`;

const newWipe = `                // 1. WIPE THE CLOUD (Deletes all rows safely)
                const { error: prodErr } = await supabase.from('products').delete().not('id', 'is', null);
                const { error: bookErr } = await supabase.from('bookers').delete().not('id', 'is', null); 
                const { error: orderErr } = await supabase.from('orders').delete().not('id', 'is', null);  
                const { error: shopErr } = await supabase.from('shops').delete().not('id', 'is', null);

                // Check if ANY cloud deletion failed
                if (prodErr || bookErr || orderErr || shopErr) {
                  const failedTables = [prodErr && 'Products', bookErr && 'Bookers', orderErr && 'Orders', shopErr && 'Shops'].filter(Boolean).join(', ');
                  throw new Error(\`Cloud wipe failed for: \${failedTables}. Local data preserved.\`);
                }`;

content = content.replace(oldWipe, newWipe);
fs.writeFileSync('src/views/SettingsView.tsx', content);
