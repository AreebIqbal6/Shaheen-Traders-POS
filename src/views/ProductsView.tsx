import type { Product } from '../types/index';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, Upload, Loader2, ScanLine } from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';



export const generateSKU = (name: string, barcode: string) => {
  const safeName = name || 'Product';
  const words = safeName.split(' ').filter(w => w.length > 0);
  
  if (words.length >= 2) {
    prefix = (words[0].substring(0, 3) + words[1].substring(0, 3)).toUpperCase().replace(/[^A-Z]/g, 'X');
  } else if (words.length === 1) {
    prefix = words[0].substring(0, 6).toUpperCase().replace(/[^A-Z]/g, 'X');
  } else {
    prefix = 'PRD';
  }
  const suffix = barcode ? barcode.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}-${suffix}`;
};

interface ProductsViewProps {
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
}

const PENDING_OP_TTL_MS = 6000;
const REFETCH_DEBOUNCE_MS = 250;

export default function ProductsView({ products = [], setProducts }: ProductsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'critical' | 'low'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const formatLakhs = (val: number) => `Rs ${val.toLocaleString('en-PK')}`;

  const totalProducts = products.length;
  const criticalStock = products.filter(p => p.stock <= 2).length;
  const lowStock = products.filter(p => p.stock > 2 && p.stock <= 10).length;
  const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const [minStockDict, setMinStockDict] = useState<Record<string, number>>({});

  useEffect(() => {
    setMinStockDict(JSON.parse(localStorage.getItem('shaheen_min_stock') || '{}'));
  }, []);

  const saveMinStock = (id: string, minStock: number) => {
    const newDict = { ...minStockDict, [id]: minStock };
    setMinStockDict(newDict);
    localStorage.setItem('shaheen_min_stock', JSON.stringify(newDict));
  };

  const pendingOpsRef = useRef<Map<string, number>>(new Map());
  const isWipingRef = useRef(false);
  const refetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markPending = (id: string) => pendingOpsRef.current.set(id, Date.now() + PENDING_OP_TTL_MS);
  const isPending = (id: string) => {
    const expiry = pendingOpsRef.current.get(id);
    if (expiry === undefined) return false;
    if (Date.now() > expiry) {
      pendingOpsRef.current.delete(id);
      return false;
    }
    return true;
  };
  const clearPending = (id: string) => pendingOpsRef.current.delete(id);

  const toOptionalNumber = (val: unknown): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = Number(val);
    return Number.isFinite(num) ? num : undefined;
  };

  const mapRowToProduct = (row: any): Product => ({
    id: String(row.id),
    barcode: row.barcode != null ? String(row.barcode) : '',
    name: row.name != null ? String(row.name) : '',
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    sku: row.sku != null ? String(row.sku) : undefined,
    category: row.category != null ? String(row.category) : undefined,
    pcsPerBox: toOptionalNumber(row.pcs_per_box ?? row.pcsPerBox),
    boxPerCtn: toOptionalNumber(row.box_per_ctn ?? row.boxPerCtn),
  });

  const mapProductToRow = (product: Omit<Product, 'id'>) => ({
    barcode: product.barcode,
    name: product.name,
    price: product.price,
    stock: product.stock,
    sku: product.sku ?? null,
    category: product.category ?? null,
    pcs_per_box: product.pcsPerBox ?? null,
    box_per_ctn: product.boxPerCtn ?? null,
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map(mapRowToProduct);
      
      // Update local storage directly so mobile/offline modes get the latest truth
      localStorage.setItem('shaheen_products', JSON.stringify(mappedData));

      // ONLY update state if the parent component actually passed the function
      if (typeof setProducts === 'function') {
        setProducts(mappedData);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch products from Supabase:', err);
      // Suppressed the error toast here to stop the UI from crashing if offline
    }
  };

  const scheduleFetch = (delay: number = REFETCH_DEBOUNCE_MS) => {
    if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    refetchTimeoutRef.current = setTimeout(() => {
      refetchTimeoutRef.current = null;
      fetchProducts();
    }, delay);
  };

  useEffect(() => {
    const channel = supabase
      .channel('products-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (isWipingRef.current) return;
          const affectedId = (payload.new as any)?.id ?? (payload.old as any)?.id;
          const idStr = affectedId !== undefined && affectedId !== null ? String(affectedId) : null;
          if (idStr && isPending(idStr)) {
            clearPending(idStr);
            return;
          }
          scheduleFetch();
        }
      )
      .subscribe();

    fetchProducts();

    return () => {
      supabase.removeChannel(channel);
      if (refetchTimeoutRef.current) clearTimeout(refetchTimeoutRef.current);
    };
  }, []);

  const [formData, setFormData] = useState<Partial<Product> & { minStock?: number }>({
    barcode: '', name: '', price: 0, stock: 0, minStock: 5
  });

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    const matchFilter = currentFilter === 'all' || 
                        (currentFilter === 'critical' && p.stock <= 2) || 
                        (currentFilter === 'low' && p.stock <= 10);
    return matchSearch && matchFilter;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ ...product, minStock: minStockDict[product.id] ?? 5 });
    } else {
      setEditingProduct(null);
      setFormData({ barcode: '', name: '', price: 0, stock: 0, sku: '', minStock: 5 });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } else {
      setIsScannerActive(false);
    }
  }, [isModalOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.barcode) { toast.error('Name and Barcode are required'); return; }

    const finalFormData = { ...formData };
    if (!finalFormData.sku) {
      finalFormData.sku = generateSKU(finalFormData.name || '', finalFormData.barcode || '');
    }

    const mStock = finalFormData.minStock ?? 5;
    delete finalFormData.minStock;

    if (editingProduct) {
      const updatedProduct = { ...editingProduct, ...finalFormData } as Product;
      markPending(editingProduct.id);

      if (typeof setProducts === 'function') {
         setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
      }
      saveMinStock(editingProduct.id, mStock);
      setIsModalOpen(false);

      try {
        const { error } = await supabase.from('products').update(mapProductToRow(updatedProduct)).eq('id', editingProduct.id);
        if (error) throw error;
      } catch (err: unknown) {
        clearPending(editingProduct.id);
        toast.error('Failed to save changes: ' + err.message);
        fetchProducts(); 
      }
    } else {
      const tempId = 'temp-' + Date.now().toString() + Math.random().toString(36).slice(2);
      const tempProduct = { ...finalFormData, id: tempId } as Product;

      if (typeof setProducts === 'function') {
         setProducts(prev => [tempProduct, ...prev]);
      }
      setIsModalOpen(false);

      try {
        const { data, error } = await supabase.from('products').insert(mapProductToRow(finalFormData as Omit<Product, 'id'>)).select().single();
        if (error) throw error;

        const savedProduct = mapRowToProduct(data);
        markPending(savedProduct.id);
        saveMinStock(savedProduct.id, mStock);

        if (typeof setProducts === 'function') {
           setProducts(prev => prev.map(p => p.id === tempId ? savedProduct : p));
        }
      } catch (err: unknown) {
        toast.error('Failed to save product: ' + err.message);
        if (typeof setProducts === 'function') setProducts(prev => prev.filter(p => p.id !== tempId));
        fetchProducts();
      }
    }
  };

  const handleGenerateSKU = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'P') : 'PRD';
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, barcode: `${prefix}-${year}-${randomNum}` }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    markPending(id);

    if (typeof setProducts === 'function') {
       setProducts(prev => prev.filter(p => p.id !== id));
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error("Supabase delete failed:", error);

      const deletedQueue = JSON.parse(localStorage.getItem('shaheen_deleted_products') || '[]');
      if (!deletedQueue.includes(id)) {
        deletedQueue.push(id);
        localStorage.setItem('shaheen_deleted_products', JSON.stringify(deletedQueue));
      }

      const newMinStockDict = { ...minStockDict };
      delete newMinStockDict[id];
      setMinStockDict(newMinStockDict);
      localStorage.setItem('shaheen_min_stock', JSON.stringify(newMinStockDict));
      toast.success('Product deleted.');
    } catch (err: unknown) {
      clearPending(id);
      toast.error('Failed to delete product: ' + err.message);
      fetchProducts(); 
    }
  };

  async function fetchProductDetails(barcode: string) {
    if (barcode.length < 8) return;
    setIsLoadingApi(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product?.product_name) {
        setFormData(prev => ({ 
          ...prev, 
          name: data.product.brands ? `${data.product.brands} ${data.product.product_name}` : data.product.product_name 
        }));
      }
    } catch (e) {
      console.error("Barcode API lookup failed", e);
    }
    setIsLoadingApi(false);
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      const newProducts: Product[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [barcode, name, priceStr, stockStr] = line.split(',');
        const sku = generateSKU(name?.trim() || 'Product', barcode?.trim() || '');
        newProducts.push({
          id: 'temp-' + Date.now().toString() + Math.random() + i,
          barcode: barcode?.trim() || '',
          sku: sku,
          name: name?.trim() || 'Unknown Product',
          price: parseFloat(priceStr) || 0,
          stock: parseInt(stockStr) || 0
        });
      }
      
      if (newProducts.length > 0) {
        if (typeof setProducts === 'function') {
           setProducts(prev => [...newProducts, ...prev]);
        }
        toast.success(`Successfully imported ${newProducts.length} products!`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-50 dark:bg-[#0a0a0c] p-4 md:p-8 overflow-x-hidden">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-xl p-4 md:p-5 flex flex-col justify-between h-full min-h-[100px]">
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Products</span>
          <span className="text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-slate-50">{totalProducts}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-xl p-4 md:p-5 flex flex-col justify-between h-full min-h-[100px] relative overflow-hidden group">
          <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Critical Stock</span>
          <span className="text-xl lg:text-2xl xl:text-3xl font-bold text-red-600 dark:text-red-400">{criticalStock}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-xl p-4 md:p-5 flex flex-col justify-between h-full min-h-[100px]">
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Low Stock</span>
          <span className="text-xl lg:text-2xl xl:text-3xl font-bold text-amber-600 dark:text-amber-400">{lowStock}</span>
        </div>
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-xl p-4 md:p-5 flex flex-col justify-between h-full min-h-[100px]">
          <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Inventory Value</span>
          <span className="text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900 dark:text-slate-50">{formatLakhs(inventoryValue)}</span>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-md p-1 rounded-lg border border-slate-200 dark:border-zinc-800/50 overflow-x-auto w-full md:w-auto custom-scrollbar shadow-inner">
          <button 
            onClick={() => setCurrentFilter('all')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all ${currentFilter === 'all' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm border border-slate-800 dark:border-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            All Products
          </button>
          <button 
            onClick={() => setCurrentFilter('critical')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${currentFilter === 'critical' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm border border-slate-800 dark:border-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            Critical
          </button>
          <button 
            onClick={() => setCurrentFilter('low')}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${currentFilter === 'low' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm border border-slate-800 dark:border-slate-100' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
            Low Stock
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <div className="flex items-center bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-lg px-3 py-1.5 w-full sm:w-64 h-[36px] focus-within:border-blue-500 transition-all">
            <Search size={16} className="text-slate-600 dark:text-slate-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by name or barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] w-full font-medium placeholder:text-slate-500 dark:text-slate-500 text-white"
            />
          </div>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleCSVUpload}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm text-slate-700 dark:text-slate-200 px-3 md:px-4 py-1.5 h-[36px] rounded-lg font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 text-[13px] whitespace-nowrap"
            >
              <Upload size={16} className="shrink-0" /> Import CSV
            </button>

            <button 
              onClick={() => handleOpenModal()}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-1.5 h-[36px] rounded-lg font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-[13px] whitespace-nowrap border-t border-slate-300 dark:border-slate-600"
            >
              <Plus size={16} className="shrink-0" /> Add Product
            </button>

            <button 
              onClick={() => {
                 toast.custom((t) => (
                    <div className={(t.visible ? 'animate-enter' : 'animate-leave') + " max-w-md w-full bg-white dark:bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 p-5"}>
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-8 w-8 text-red-600 shrink-0" />
                        <div className="flex-1 pt-0.5">
                          <p className="text-[15px] font-bold text-slate-900 dark:text-slate-100 mb-1">Clear Entire Inventory</p>
                          <p className="text-[13px] text-slate-500">Are you sure? This will delete ALL products locally and from the cloud.</p>
                          <input id={"wipe-inventory-" + t.id} type="password" placeholder="Enter Admin Password" className="w-full mt-3 px-3 py-2 bg-slate-50 dark:bg-zinc-800 border rounded-md text-[13px]" />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end gap-3">
                        <button onClick={() => toast.dismiss(t.id)} className="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md text-[13px] font-semibold">Cancel</button>
                        <button onClick={async () => {
                          const pwdInput = document.getElementById("wipe-inventory-" + t.id) as HTMLInputElement;
                          if (pwdInput.value !== '1234') { toast.error("Incorrect Password!"); return; }
                          
                          isWipingRef.current = true;
                          pendingOpsRef.current.clear();
                          toast.loading("Clearing inventory...", { id: "clear-inv" });
                          try {
                            localStorage.setItem('shaheen_wipe_products_pending', 'true');
                            if (navigator.onLine) {
                               const { error } = await supabase.from('products').delete().gte('price', 0);
                               if (error) throw error;
                               localStorage.removeItem('shaheen_wipe_products_pending');
                            }

                            if (typeof setProducts === 'function') setProducts([]);
                            setMinStockDict({});
                            localStorage.removeItem('shaheen_products');
                            localStorage.removeItem('shaheen_b2b_products');
                            localStorage.removeItem('shaheen_b2b_products_v2');
                            localStorage.removeItem('shaheen_min_stock');
                            window.dispatchEvent(new Event('force_remount'));

                            toast.success("Inventory cleared successfully!", { id: "clear-inv" });
                            toast.dismiss(t.id);
                          } catch (e: unknown) { 
                            toast.error("Failed to clear cloud inventory: " + e.message, { id: "clear-inv" }); 
                          } finally {
                            setTimeout(() => { isWipingRef.current = false; }, 1500);
                          }
                        }} className="bg-red-600 text-white px-4 py-2 rounded-md text-[13px] font-bold">YES, CLEAR</button>
                      </div>
                    </div>
                  ), { duration: Infinity });
              }}
              className="flex-1 sm:flex-none bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-3 md:px-4 py-1.5 h-[36px] rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 text-[13px] whitespace-nowrap"
            >
              <Trash2 size={16} className="shrink-0" /> Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
          <table className="hidden md:table w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/50 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Barcode</th>
                <th className="px-5 py-3.5 font-semibold">SKU</th>
                <th className="px-5 py-3.5 font-semibold">Product Name</th>
                <th className="px-5 py-3.5 font-semibold">Price</th>
                <th className="px-5 py-3.5 font-semibold">Stock</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredProducts.map(product => {
                const mStock = minStockDict[product.id] ?? 5;
                const isCrit = product.stock <= mStock;
                const isWarn = product.stock > mStock && product.stock <= mStock + 5;
                
                return (
                  <tr key={product.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors group">
                    <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:text-slate-50 transition-colors">{product.barcode}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-50">{product.sku || '-'}</td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2 whitespace-normal break-words min-w-[200px]">
                       {product.name}
                    </td>
                    <td className="px-5 py-3 text-slate-900 dark:text-slate-50 font-medium">Rs {product.price.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold inline-flex items-center gap-1.5 ${
                        isCrit ? 'bg-[var(--color-crit-dim)] text-red-600 dark:text-red-400 border border-[var(--color-crit)]/30' : 
                        isWarn ? 'bg-[var(--color-warn-dim)] text-amber-600 dark:text-amber-400 border border-[var(--color-warn)]/30' : 
                        'text-slate-600 dark:text-slate-400'
                      }`}>
                        {isCrit && <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>}
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleOpenModal(product)} className="text-slate-600 dark:text-slate-400 hover:text-white p-1.5 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(product.id)} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:text-red-400 p-1.5 ml-1 transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500 dark:text-slate-500 font-medium">
                    No products found. Import a CSV or add manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="md:hidden flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
             {filteredProducts.map(product => {
                const mStock = minStockDict[product.id] ?? 5;
                const isCrit = product.stock <= mStock;
                const isWarn = product.stock > mStock && product.stock <= mStock + 5;
                
                return (
                <div key={product.id} className="p-4 flex flex-col gap-2 hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                   <div className="flex justify-between items-start gap-2">
                       <div className="flex flex-col min-w-0 flex-1">
                         <h3 className="font-semibold text-white text-sm leading-tight break-words">{product.name}</h3>
                         <div className="flex items-center gap-2 mt-1 truncate">
                           <span className="font-mono text-slate-600 dark:text-slate-400 text-xs truncate">{product.barcode}</span>
                           <span className="font-mono font-bold text-slate-900 dark:text-slate-50 text-[10px] bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 px-1.5 py-0.5 rounded-sm shrink-0">{product.sku || '-'}</span>
                         </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleOpenModal(product)} className="text-slate-600 dark:text-slate-400 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 w-8 h-8 flex items-center justify-center rounded-md"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 dark:text-red-400 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 w-8 h-8 flex items-center justify-center rounded-md"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Rs {product.price.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold flex items-center gap-1.5 ${
                        isCrit ? 'bg-[var(--color-crit-dim)] text-red-600 dark:text-red-400 border border-[var(--color-crit)]/30' : 
                        isWarn ? 'bg-[var(--color-warn-dim)] text-amber-600 dark:text-amber-400 border border-[var(--color-warn)]/30' : 
                        'text-slate-600 dark:text-slate-400'
                      }`}>
                        Stock: {product.stock}
                      </span>
                   </div>
                </div>
             )})}
             {filteredProducts.length === 0 && (
                <div className="p-10 text-center text-slate-500 dark:text-slate-500 font-medium">
                  No products found. Import a CSV or add manually.
                </div>
             )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 dark:border-zinc-800/50 flex justify-between items-center bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Barcode Scanner / SKU</label>
                  {!editingProduct && (
                    <button 
                      onClick={handleGenerateSKU}
                      className="text-[10px] bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-zinc-800/50 px-2 py-0.5 rounded transition-colors font-medium"
                    >
                      Auto-Generate
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    ref={barcodeInputRef}
                    type="text" 
                    value={formData.barcode} 
                    onChange={e => {
                       setFormData({...formData, barcode: e.target.value});
                       if (e.target.value.length >= 12 && !editingProduct) {
                         fetchProductDetails(e.target.value);
                       }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!editingProduct && formData.barcode) {
                          fetchProductDetails(formData.barcode);
                        }
                      }
                    }}
                    onBlur={() => { if (!editingProduct && formData.barcode) fetchProductDetails(formData.barcode); }}
                    className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono text-[13px] pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Scan barcode..."
                  />
                  {isLoadingApi ? (
                    <Loader2 size={16} className="absolute right-3 top-3 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <button 
                      onClick={() => setIsScannerActive(!isScannerActive)}
                      className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${isScannerActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      <ScanLine size={16} />
                    </button>
                  )}
                </div>
                
                {isScannerActive && (
                  <CameraScanner 
                    onClose={() => setIsScannerActive(false)} 
                    onScan={(decodedText) => {
                      setFormData(prev => ({...prev, barcode: decodedText}));
                      setIsScannerActive(false);
                      if (!editingProduct) {
                        fetchProductDetails(decodedText);
                      }
                    }} 
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Product Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-medium text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:text-slate-500"
                  placeholder="e.g. Lays French Cheese"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">SKU Code (Optional)</label>
                <input 
                  type="text" 
                  value={formData.sku || ''} 
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:text-slate-500"
                  placeholder="Auto-generated if empty"
                />
              </div>
              
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Price (PKR) / Pc</label>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Total Stock (Pcs)</label>
                    <input 
                      type="number" 
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Min Stock (Alert)</label>
                    <input 
                      type="number" 
                      value={formData.minStock ?? 5} 
                      onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                      className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-all font-mono font-bold text-[13px] text-amber-600 dark:text-amber-500"
                    />
                  </div>
                </div>

                {/* UOM Conversions */}
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Pcs per Box</label>
                    <input 
                      type="number" 
                      value={formData.pcsPerBox || ''} 
                      onChange={e => setFormData({...formData, pcsPerBox: parseInt(e.target.value) || undefined})}
                      placeholder="Optional"
                      className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Boxes per Ctn</label>
                    <input 
                      type="number" 
                      value={formData.boxPerCtn || ''} 
                      onChange={e => setFormData({...formData, boxPerCtn: parseInt(e.target.value) || undefined})}
                      placeholder="Optional"
                      className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Quick Stock Adder */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg">
                   <label className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 block">Quick Stock Adder</label>
                   <div className="flex gap-2">
                      <input 
                        type="number"
                        id="quick-stock-amt"
                        placeholder="Qty"
                        className="w-20 bg-white dark:bg-zinc-900/60 border border-blue-200 dark:border-blue-800 rounded px-2 py-2 text-[13px] font-mono focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                      />
                      <select id="quick-stock-unit" className="flex-1 bg-white dark:bg-zinc-900/60 border border-blue-200 dark:border-blue-800 rounded px-2 py-2 text-[13px] focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white">
                        <option value="Pcs">Pieces</option>
                        <option value="Box" disabled={!formData.pcsPerBox}>Boxes {!formData.pcsPerBox ? '(Set Pcs/Box first)' : ''}</option>
                        <option value="Ctn" disabled={!(formData.pcsPerBox && formData.boxPerCtn)}>Cartons {!(formData.pcsPerBox && formData.boxPerCtn) ? '(Set Box/Ctn first)' : ''}</option>
                      </select>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          const amt = parseInt((document.getElementById('quick-stock-amt') as HTMLInputElement).value) || 0;
                          const unit = (document.getElementById('quick-stock-unit') as HTMLSelectElement).value;
                          let multiplier = 1;
                          if (unit === 'Box') multiplier = formData.pcsPerBox || 1;
                          if (unit === 'Ctn') multiplier = (formData.pcsPerBox || 1) * (formData.boxPerCtn || 1);
                          setFormData({...formData, stock: (formData.stock || 0) + (amt * multiplier)});
                          (document.getElementById('quick-stock-amt') as HTMLInputElement).value = '';
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-[13px] font-bold shadow-sm transition-colors"
                      >Add Stock</button>
                   </div>
                </div>
              </div>
            <div className="px-6 py-5 border-t border-slate-200 dark:border-zinc-800/50 flex justify-end gap-3 bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-50 rounded-lg transition-colors text-[13px]">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-[13px] border-t border-slate-300 dark:border-slate-600">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
