import { useState, useCallback } from 'react';
import type { Product } from '../views/ProductsView';
import type { CartItem } from '../types/index';
import { generateSKU } from '../views/ProductsView';

export function useCart(products: Product[]) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        ...product, 
        cartId: Date.now().toString() + Math.random(), 
        quantity: 1, 
        uom: 'Pcs', 
        basePrice: product.price 
      }];
    });
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const updateCartItem = useCallback((cartId: string, updates: Partial<CartItem>) => {
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, ...updates } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal
  };
}
