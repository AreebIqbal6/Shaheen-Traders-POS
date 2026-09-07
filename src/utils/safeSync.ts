import { supabase } from '../lib/supabase';

export async function safeSupabaseUpdate(table: string, id: string, payload: any) {
  let currentPayload = { ...payload };
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase.from(table).update(currentPayload).eq('id', id).select();
    
    if (error) {
      const errMsg = error.message || '';
      const match = errMsg.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const badCol = match[1];
        console.warn(`[SafeSync] Removing unknown column '${badCol}' and retrying...`);
        delete currentPayload[badCol];
        attempts++;
        continue;
      }
      throw error;
    }
    
    return { data, error };
  }
  
  throw new Error("Too many retries trying to remove unknown columns");
}

export async function safeSupabaseInsert(table: string, payload: any) {
  let currentPayload = Array.isArray(payload) ? [...payload.map(p => ({...p}))] : { ...payload };
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase.from(table).insert(currentPayload as any).select();
    
    if (error) {
      const errMsg = error.message || '';
      const match = errMsg.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const badCol = match[1];
        console.warn(`[SafeSync] Removing unknown column '${badCol}' and retrying...`);
        if (Array.isArray(currentPayload)) {
          currentPayload = currentPayload.map(p => {
            const newP = { ...p };
            delete newP[badCol];
            return newP;
          });
        } else {
          delete (currentPayload as any)[badCol];
        }
        attempts++;
        continue;
      }
      throw error;
    }
    
    return { data, error };
  }
  
  throw new Error("Too many retries trying to remove unknown columns");
}

export async function safeSupabaseUpsert(table: string, payload: any, options?: { onConflict?: string }) {
  let currentPayload = Array.isArray(payload) ? [...payload.map(p => ({...p}))] : { ...payload };
  let attempts = 0;

  while (attempts < 5) {
    const { data, error } = await supabase.from(table).upsert(currentPayload as any, options).select();
    
    if (error) {
      const errMsg = error.message || '';
      const match = errMsg.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        const badCol = match[1];
        console.warn(`[SafeSync] Removing unknown column '${badCol}' and retrying...`);
        if (Array.isArray(currentPayload)) {
          currentPayload = currentPayload.map(p => {
            const newP = { ...p };
            delete newP[badCol];
            return newP;
          });
        } else {
          delete (currentPayload as any)[badCol];
        }
        attempts++;
        continue;
      }
      throw error;
    }
    
    return { data, error };
  }
  
  throw new Error("Too many retries trying to remove unknown columns");
}
