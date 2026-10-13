import { create } from 'zustand';
import type { Product } from '../types/index';
import { fetchAllProducts } from '../utils/fetchAllProducts';

interface InventoryState {
  products: Product[];
  minStockDict: Record<string, number>;
  retailPriceDict: Record<string, number>;
  isLoading: boolean;
  setProducts: (updater: Product[] | ((prev: Product[]) => Product[])) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  updateProductStock: (id: string, delta: number) => void;
  saveMinStock: (id: string, minStock: number) => void;
  saveRetailPrice: (id: string, price: number | undefined | null) => void;
  fetchProducts: () => Promise<Product[]>;
}

const safeParseJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: safeParseJSON<Product[]>('shaheen_products', []),
  minStockDict: safeParseJSON<Record<string, number>>('shaheen_min_stock', {}),
  retailPriceDict: safeParseJSON<Record<string, number>>('shaheen_retail_prices', {}),
  isLoading: false,

  setProducts: (updater) => {
    set((state) => {
      const nextProducts = typeof updater === 'function' ? updater(state.products) : updater;
      try {
        localStorage.setItem('shaheen_products', JSON.stringify(nextProducts));
      } catch {}
      return { products: nextProducts };
    });
  },

  updateProduct: (id, updates) => {
    set((state) => {
      const nextProducts = state.products.map((p) => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem('shaheen_products', JSON.stringify(nextProducts));
      } catch {}
      return { products: nextProducts };
    });
  },

  updateProductStock: (id, delta) => {
    set((state) => {
      const nextProducts = state.products.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p
      );
      try {
        localStorage.setItem('shaheen_products', JSON.stringify(nextProducts));
      } catch {}
      return { products: nextProducts };
    });
  },

  saveMinStock: (id, minStock) => {
    set((state) => {
      const newDict = { ...state.minStockDict, [id]: minStock };
      try {
        localStorage.setItem('shaheen_min_stock', JSON.stringify(newDict));
      } catch {}
      return { minStockDict: newDict };
    });
  },

  saveRetailPrice: (id, price) => {
    set((state) => {
      const newDict = { ...state.retailPriceDict };
      if (price === undefined || price === null) {
        delete newDict[id];
      } else {
        newDict[id] = price;
      }
      try {
        localStorage.setItem('shaheen_retail_prices', JSON.stringify(newDict));
      } catch {}
      return { retailPriceDict: newDict };
    });
  },

  fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const rawData = await fetchAllProducts();
      const currentRetail = get().retailPriceDict;

      const mappedData: Product[] = (rawData || []).map((row: any) => ({
        id: String(row.id),
        barcode: row.barcode != null ? String(row.barcode) : '',
        name: row.name != null ? String(row.name) : '',
        price: Number(row.price) || 0,
        stock: Number(row.stock ?? row.total_base_pieces) || 0,
        sku: row.sku != null ? String(row.sku) : undefined,
        category: row.category != null ? String(row.category) : undefined,
        item_type: row.item_type === 'Imported' ? 'Imported' : 'Local',
        pcsPerBox: row.pcs_per_box ? Number(row.pcs_per_box) : undefined,
        boxPerCtn: row.box_per_ctn ? Number(row.box_per_ctn) : undefined,
        retail_price:
          row.retail_price != null
            ? Number(row.retail_price)
            : currentRetail[String(row.id)] !== undefined
            ? Number(currentRetail[String(row.id)])
            : undefined
      }));

      // Strict runtime deduplication: guarantee no two products ever have the same SKU
      const seenSkus = new Set<string>();
      let maxSkuNum = 0;
      for (const p of mappedData) {
        if (p.sku && /^\d+$/.test(p.sku.trim())) {
          const num = parseInt(p.sku.trim(), 10);
          if (num > maxSkuNum) maxSkuNum = num;
        }
      }

      const deduplicatedData = mappedData.map((p) => {
        if (p.sku && /^\d+$/.test(p.sku.trim())) {
          const cleanSku = p.sku.trim();
          if (seenSkus.has(cleanSku)) {
            maxSkuNum++;
            const newSku = maxSkuNum.toString().padStart(4, '0');
            seenSkus.add(newSku);
            return { ...p, sku: newSku };
          }
          seenSkus.add(cleanSku);
        }
        return p;
      });

      set({ products: deduplicatedData, isLoading: false });
      try {
        localStorage.setItem('shaheen_products', JSON.stringify(deduplicatedData));
      } catch {}
      return deduplicatedData;
    } catch (e) {
      console.warn('Failed to fetch products from Supabase, relying on local cache:', e);
      set({ isLoading: false });
      return get().products;
    }
  }
}));
