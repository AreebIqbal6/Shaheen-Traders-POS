import { supabase } from '../lib/supabase';

export const resequenceSkusBackground = async (changedSkus: { id: string, newSku: string }[]) => {
  if (!changedSkus || changedSkus.length === 0) return;

  // Process in chunks of 50 to avoid hitting API limits
  const chunkSize = 50;
  // 1. Rename to TEMP to avoid unique constraints
  for (let i = 0; i < changedSkus.length; i += chunkSize) {
    const chunk = changedSkus.slice(i, i + chunkSize);
    await Promise.allSettled(
      chunk.map(update => 
        supabase.from('products').update({ sku: update.newSku + '-TEMP' }).eq('id', update.id)
      )
    );
  }

  // 2. Rename to final SKUs
  for (let i = 0; i < changedSkus.length; i += chunkSize) {
    const chunk = changedSkus.slice(i, i + chunkSize);
    await Promise.allSettled(
      chunk.map(update => 
        supabase.from('products').update({ sku: update.newSku }).eq('id', update.id)
      )
    );
  }
};
