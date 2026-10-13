import { describe, it, expect, beforeEach } from 'vitest';
import { enqueueOfflineAction, flushOfflineQueue } from './safeSync';

describe('SafeSync Offline Queue Logic', () => {
  beforeEach(() => {
    localStorage.removeItem('shaheen_offline_sync_queue');
  });

  it('enqueues offline actions into localStorage', () => {
    enqueueOfflineAction({
      type: 'INSERT',
      table: 'products',
      payload: { name: 'Test Rice 1kg', price: 200 }
    });

    const raw = localStorage.getItem('shaheen_offline_sync_queue');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].type).toBe('INSERT');
    expect(parsed[0].table).toBe('products');
    expect(parsed[0].payload.name).toBe('Test Rice 1kg');
  });

  it('handles multiple queue entries sequentially', () => {
    enqueueOfflineAction({ type: 'INSERT', table: 'orders', payload: { id: 'ord-1' } });
    enqueueOfflineAction({ type: 'UPDATE', table: 'orders', payload: { id: 'ord-1', status: 'Dispatched' } });

    const raw = localStorage.getItem('shaheen_offline_sync_queue');
    const parsed = JSON.parse(raw!);
    expect(parsed.length).toBe(2);
    expect(parsed[0].type).toBe('INSERT');
    expect(parsed[1].type).toBe('UPDATE');
  });

  it('flushes empty queue gracefully without errors', async () => {
    const result = await flushOfflineQueue();
    expect(result.processed).toBe(0);
    expect(result.remaining).toBe(0);
  });
});
