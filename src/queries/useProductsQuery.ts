import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../views/ProductsView';
import { get, set } from 'idb-keyval';

export function useProductsQuery() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        // Cache to IndexedDB for offline use
        if (data) {
          await set('pos-products-cache', data);
        }
        
        return (data || []) as Product[];
      } catch (err) {
        console.error('Failed to fetch products from Supabase, falling back to cache:', err);
        // Fallback to IndexedDB
        const cached = await get<Product[]>('pos-products-cache');
        if (cached) return cached;
        throw err;
      }
    }
  });
}
