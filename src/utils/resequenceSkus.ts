import { supabase } from '../lib/supabase';

export const resequenceSkusBackground = async (changedSkus: { id: string, newSku: string }[]) => {
  if (!changedSkus || changedSkus.length === 0) return;

  // Process in chunks of 50 to avoid hitting API limits
  const chunkSize = 50;
  for (let i = 0; i < changedSkus.length; i += chunkSize) {
    const chunk = changedSkus.slice(i, i + chunkSize);
    
    // We fire all updates in this chunk concurrently
    await Promise.allSettled(
      chunk.map(update => 
        supabase.from('products').update({ sku: update.newSku }).eq('id', update.id)
      )
    );
  }
};
