import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';
import type { Product } from '../views/ProductsView';

describe('useCartStore Zustand Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  const sampleProduct: Product = {
    id: 'prod-001',
    name: 'National Salt 800g',
    price: 60,
    stock: 100,
    barcode: 'BC-NAT-SALT',
    sku: '0001'
  };

  it('initializes with an empty cart', () => {
    expect(useCartStore.getState().cart).toEqual([]);
    expect(useCartStore.getState().getCartTotal()).toBe(0);
  });

  it('adds an item to cart and calculates total', () => {
    useCartStore.getState().addToCart(sampleProduct);
    const cart = useCartStore.getState().cart;
    expect(cart.length).toBe(1);
    expect(cart[0].id).toBe('prod-001');
    expect(cart[0].quantity).toBe(1);
    expect(useCartStore.getState().getCartTotal()).toBe(60);
  });

  it('increments quantity when existing product is added again', () => {
    useCartStore.getState().addToCart(sampleProduct);
    useCartStore.getState().addToCart(sampleProduct);
    const cart = useCartStore.getState().cart;
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(2);
    expect(useCartStore.getState().getCartTotal()).toBe(120);
  });

  it('updates cart item quantity', () => {
    useCartStore.getState().addToCart(sampleProduct);
    const cartId = useCartStore.getState().cart[0].cartId;

    useCartStore.getState().updateCartItem(cartId, { quantity: 5 });
    expect(useCartStore.getState().cart[0].quantity).toBe(5);
    expect(useCartStore.getState().getCartTotal()).toBe(300);
  });

  it('removes item when quantity updated to 0 or negative', () => {
    useCartStore.getState().addToCart(sampleProduct);
    const cartId = useCartStore.getState().cart[0].cartId;

    useCartStore.getState().updateCartItem(cartId, { quantity: 0 });
    expect(useCartStore.getState().cart.length).toBe(0);
  });

  it('removes item explicitly by cartId', () => {
    useCartStore.getState().addToCart(sampleProduct);
    const cartId = useCartStore.getState().cart[0].cartId;

    useCartStore.getState().removeFromCart(cartId);
    expect(useCartStore.getState().cart.length).toBe(0);
  });

  it('clears cart entirely', () => {
    useCartStore.getState().addToCart(sampleProduct);
    expect(useCartStore.getState().cart.length).toBe(1);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().cart.length).toBe(0);
    expect(useCartStore.getState().getCartTotal()).toBe(0);
  });
});
