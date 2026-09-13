import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../views/ProductsView';
import type { CartItem } from '../types/index';
import { generateSKU } from '../views/ProductsView';

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (cartId: string) => void;
  updateCartItem: (cartId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (product) => set((state) => {
        const existing = state.cart.find((i) => i.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((i) => 
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          };
        }
        
        const newItem: CartItem = {
          ...product,
          cartId: Date.now().toString() + Math.random(),
          quantity: 1,
          uom: 'Pcs',
          basePrice: product.price
        };
        
        return { cart: [...state.cart, newItem] };
      }),

      removeFromCart: (cartId) => set((state) => ({
        cart: state.cart.filter((item) => item.cartId !== cartId)
      })),

      updateCartItem: (cartId, updates) => set((state) => {
        if (updates.quantity !== undefined && updates.quantity <= 0) {
          return {
            cart: state.cart.filter((item) => item.cartId !== cartId)
          };
        }
        return {
          cart: state.cart.map((item) => 
            item.cartId === cartId ? { ...item, ...updates } : item
          )
        };
      }),

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
