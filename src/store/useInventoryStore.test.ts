import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from './useInventoryStore';
import type { Product } from '../types/index';

describe('useInventoryStore Zustand Store', () => {
  beforeEach(() => {
    useInventoryStore.getState().setProducts([]);
  });

  const testProduct: Product = {
    id: 'prod-100',
    name: 'Shan Biryani Masala 50g',
    price: 120,
    stock: 50,
    barcode: 'BC-SHAN-BIR',
    sku: '0100',
    item_type: 'Local',
    pcsPerBox: 24,
    boxPerCtn: 8
  };

  it('sets and retrieves products accurately', () => {
    useInventoryStore.getState().setProducts([testProduct]);
    const products = useInventoryStore.getState().products;
    expect(products.length).toBe(1);
    expect(products[0].name).toBe('Shan Biryani Masala 50g');
    expect(products[0].stock).toBe(50);
  });

  it('updates product attributes', () => {
    useInventoryStore.getState().setProducts([testProduct]);
    useInventoryStore.getState().updateProduct('prod-100', { price: 130, stock: 45 });

    const updated = useInventoryStore.getState().products.find((p) => p.id === 'prod-100');
    expect(updated?.price).toBe(130);
    expect(updated?.stock).toBe(45);
  });

  it('updates product stock with delta', () => {
    useInventoryStore.getState().setProducts([testProduct]);
    // Received 10 pieces
    useInventoryStore.getState().updateProductStock('prod-100', 10);
    expect(useInventoryStore.getState().products[0].stock).toBe(60);

    // Sold 20 pieces
    useInventoryStore.getState().updateProductStock('prod-100', -20);
    expect(useInventoryStore.getState().products[0].stock).toBe(40);

    // Never goes negative
    useInventoryStore.getState().updateProductStock('prod-100', -100);
    expect(useInventoryStore.getState().products[0].stock).toBe(0);
  });

  it('persists and manages minStock thresholds', () => {
    useInventoryStore.getState().saveMinStock('prod-100', 15);
    expect(useInventoryStore.getState().minStockDict['prod-100']).toBe(15);
  });

  it('persists and manages retail prices', () => {
    useInventoryStore.getState().saveRetailPrice('prod-100', 150);
    expect(useInventoryStore.getState().retailPriceDict['prod-100']).toBe(150);

    useInventoryStore.getState().saveRetailPrice('prod-100', null);
    expect(useInventoryStore.getState().retailPriceDict['prod-100']).toBeUndefined();
  });
});
