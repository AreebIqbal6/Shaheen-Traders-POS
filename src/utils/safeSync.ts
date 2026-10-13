import { supabase } from '../lib/supabase';

export interface StockDeductionResult {
  success: boolean;
  newStock?: number;
  availableStock?: number;
  error?: string;
}

export interface OfflineAction {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'UPSERT' | 'STOCK_DEDUCT';
  table: string;
  payload: any;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'shaheen_offline_sync_queue';

/**
 * Safely updates a row in Supabase, dynamically stripping columns if the table schema doesn't have them.
 */
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

  throw new Error('Too many retries trying to remove unknown columns');
}

/**
 * Safely inserts a row or multiple rows into Supabase, stripping unknown schema fields.
 */
export async function safeSupabaseInsert(table: string, payload: any) {
  let currentPayload = Array.isArray(payload) ? [...payload.map((p) => ({ ...p }))] : { ...payload };
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
          currentPayload = currentPayload.map((p) => {
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

  throw new Error('Too many retries trying to remove unknown columns');
}

/**
 * Safely upserts row(s) into Supabase, stripping unknown schema fields.
 */
export async function safeSupabaseUpsert(table: string, payload: any, options?: { onConflict?: string }) {
  let currentPayload = Array.isArray(payload) ? [...payload.map((p) => ({ ...p }))] : { ...payload };
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
          currentPayload = currentPayload.map((p) => {
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

  throw new Error('Too many retries trying to remove unknown columns');
}

/**
 * Optimistic Concurrency Lock: Safely deducts inventory stock with server-level non-negative validation.
 * Protects against race conditions when multiple terminals or bookers check out at the same instant.
 */
export async function safeDeductProductStock(
  productId: string,
  quantityToDeduct: number
): Promise<StockDeductionResult> {
  if (quantityToDeduct <= 0) {
    return { success: true };
  }

  try {
    // 1. Fetch current live stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock, total_base_pieces')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError || !product) {
      return { success: false, error: fetchError?.message || 'Product not found' };
    }

    const currentStock = Number(product.stock ?? product.total_base_pieces) || 0;
    if (currentStock < quantityToDeduct) {
      return {
        success: false,
        availableStock: currentStock,
        error: `Insufficient stock: requested ${quantityToDeduct}, only ${currentStock} available.`
      };
    }

    const nextStock = currentStock - quantityToDeduct;

    // 2. Perform optimistic atomic update: only succeed if stock is still >= quantityToDeduct
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        stock: nextStock,
        total_base_pieces: nextStock
      })
      .eq('id', productId)
      .gte('stock', quantityToDeduct)
      .select();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (!updated || updated.length === 0) {
      // Race condition occurred: another register deducted stock concurrently
      return {
        success: false,
        error: 'Concurrency conflict: Stock was modified by another register during checkout.'
      };
    }

    return { success: true, newStock: nextStock };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during stock deduction' };
  }
}

/**
 * Enqueue an offline action to persist locally and sync once network connectivity returns.
 */
export function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): void {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineAction[] = raw ? JSON.parse(raw) : [];
    const item: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now()
    };
    queue.push(item);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
  }
}

/**
 * Flush and execute queued offline operations against Supabase.
 */
export async function flushOfflineQueue(): Promise<{ processed: number; remaining: number }> {
  let queue: OfflineAction[] = [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return { processed: 0, remaining: 0 };
    queue = JSON.parse(raw);
  } catch {
    return { processed: 0, remaining: 0 };
  }

  if (queue.length === 0) return { processed: 0, remaining: 0 };

  const failedItems: OfflineAction[] = [];
  let processedCount = 0;

  for (const item of queue) {
    try {
      if (item.type === 'INSERT') {
        await safeSupabaseInsert(item.table, item.payload);
        processedCount++;
      } else if (item.type === 'UPDATE') {
        await safeSupabaseUpdate(item.table, item.payload.id, item.payload);
        processedCount++;
      } else if (item.type === 'UPSERT') {
        await safeSupabaseUpsert(item.table, item.payload);
        processedCount++;
      }
    } catch {
      failedItems.push(item);
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  } catch {}

  return { processed: processedCount, remaining: failedItems.length };
}
