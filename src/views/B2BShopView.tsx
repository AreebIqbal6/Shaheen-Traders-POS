import React, { useState, useEffect, useMemo, useRef } from 'react';
import { playNotificationSound } from '../utils/audio';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Store, CreditCard, Search, ArrowRight, Package, User, LogOut, History, WifiOff, RefreshCw, CheckCircle2, FileText, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import B2BCheckout from '../components/B2BCheckout';
import OrderPreviewModal from '../components/OrderPreviewModal';
import SimpleOrderViewModal from '../components/SimpleOrderViewModal';
import { Skeleton } from '../components/Skeleton';
import { generateSKU } from './ProductsView';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode: string;
  category?: string;
  pcsPerBox?: number;
  boxPerCtn?: number;
}

interface CartItem extends Product {
  cartId: string;
  quantity: number;
  uom?: 'Pcs' | 'Box' | 'Ctn';
  basePrice?: number;
}

// Fallback mock data removed for production
interface B2BShopViewProps {
  isImpersonating?: boolean;
}

export default function B2BShopView({ isImpersonating = false }: B2BShopViewProps) {
  const [activeTab, setActiveTabState] = useState<'shop' | 'cart' | 'checkout' | 'dashboard'>(() => {
    return (localStorage.getItem('b2b_activeTab') as any) || 'shop';
  });
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [simpleViewOrder, setSimpleViewOrder] = useState<any>(null);

  const setActiveTab = (tab: 'shop' | 'cart' | 'checkout' | 'dashboard') => {
    setActiveTabState(tab);
    window.history.pushState({ tab }, '', `#${tab}`);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
      } else {
        setActiveTabState('shop');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('b2b_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const fetchPastOrders = async () => {
    setIsRefreshing(true);
    try {
      const activeBooker = JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}');
      
      let onlineOrders: any[] = [];
      if (navigator.onLine) {
        try {
          let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          
          // If there's a specific booker, filter by their ID; otherwise show all
          if (activeBooker.id) {
            query = query.eq('b2b_user_id', activeBooker.id);
          }
          
          const { data, error } = await query;
          if (data) onlineOrders = data;
          if (error) console.warn('Failed to fetch orders from Supabase:', error.message);
        } catch (e) {
          console.warn('Supabase query failed:', e);
        }
      }

      const offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
      
      // Merge and sort — offline orders always included
      const allOrders = [...offlineOrders.map((o: any) => ({...o, isOffline: true})), ...onlineOrders];
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setPastOrders(allOrders);
    } finally {
      setIsRefreshing(false);
    }
  };

  const syncOfflineOrders = async () => {
    const offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
    if (offlineOrders.length === 0 || !navigator.onLine) return;
    
    setIsLoading(true);
    const failedOrders: any[] = [];
    try {
      for (const order of offlineOrders) {
        try {
          // Remove local-only flags before insert just in case
          const { isOffline, contact_number, b2b_user_id, idempotency_key, source, receipt_number, payment_terms, area, booker_name, ...supabasePayload } = order;
          const finalPayload = {
            ...supabasePayload,
            idempotency_key: idempotency_key,
            receipt_number: receipt_number,
            client_phone: contact_number,
            area: area,
            booker_name: booker_name,
            payment_terms: payment_terms,
            b2b_user_id: b2b_user_id,
            items: order.items?.map((i: any) => ({
              ...i,
              basePrice: i.basePrice || i.price
            })) || []
          };
          const { error } = await supabase.from('orders').insert(finalPayload);
          if (error && error.code !== '23505') {
            console.error('Sync failed for order', receipt_number || finalPayload.id, error);
            toast.error(`Sync failed for ${receipt_number || finalPayload.id}: ${error.message}`);
            failedOrders.push(order);
          }
        } catch (e: any) {
          console.error('Sync exception for order', order.receipt_number, e);
          toast.error(`Sync error: ${e.message || 'Unknown'}`);
          failedOrders.push(order);
        }
      }
      if (failedOrders.length === 0) {
        localStorage.removeItem('shaheen_offline_orders');
        toast.success('All offline orders synced successfully!');
      } else {
        localStorage.setItem('shaheen_offline_orders', JSON.stringify(failedOrders));
        toast.error(`${failedOrders.length} order(s) failed to sync. Check console.`);
      }
      await fetchPastOrders();
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchPastOrders();
    }
  }, [activeTab]);

  // --- Background Location Tracker ---
  useEffect(() => {
    const activeBookerStr = localStorage.getItem('shaheen_active_booker');
    if (!activeBookerStr) return;
    const activeBooker = JSON.parse(activeBookerStr);
    const bookerUsername = activeBooker.username;

    // Only track if logged in and not Admin
    if (!bookerUsername || bookerUsername.includes('@')) return;

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    // Request WakeLock to keep screen on and tracker running continuously
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };
    requestWakeLock();

    let isUpdating = false;
    let latestPosition: GeolocationPosition | null = null;

    // watchPosition keeps the GPS radio alive and refining accuracy
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        latestPosition = position;
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 } // maximumAge: 0 forces fresh GPS data
    );

    const pushLocation = async () => {
      if (!latestPosition || isUpdating) return;
      isUpdating = true;
      try {
        const { latitude, longitude } = latestPosition.coords;
        
        // Check if booker already has a record
        const { data: existing } = await supabase
          .from('booker_locations')
          .select('id')
          .eq('booker_name', bookerUsername)
          .maybeSingle();

        if (existing) {
           await supabase
             .from('booker_locations')
             .update({ lat: latitude, lng: longitude, updated_at: new Date().toISOString() })
             .eq('id', existing.id);
        } else {
           await supabase
             .from('booker_locations')
             .insert({ booker_name: bookerUsername, lat: latitude, lng: longitude });
        }
      } catch (error) {
        console.error('Failed to push location:', error);
      } finally {
        isUpdating = false;
      }
    };

    // Heartbeat every 10 seconds regardless of movement
    const intervalId = setInterval(pushLocation, 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []); // Empty array ensures GPS lock is maintained continuously
  // ------------------------------------

  const handleCancelOrder = async (orderId: string) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        <span className="font-semibold text-slate-900">Cancel this order?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >No</button>
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              const offline = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
              const idx = offline.findIndex((o: any) => o.receipt_number === orderId || o.id === orderId);
              if (idx !== -1) {
                 offline[idx].status = 'CANCELLED';
                 localStorage.setItem('shaheen_offline_orders', JSON.stringify(offline));
                 toast.success('Offline order cancelled');
                 fetchPastOrders();
              } else {
                const { error } = await supabase
                  .from('orders')
                  .update({ status: 'CANCELLED' })
                  .eq('id', orderId);
                  
                if (error) toast.error('Failed to cancel order: ' + error.message);
                else {
                  toast.success('Order cancelled');
                  fetchPastOrders();
                }
              }
            }}
          >Yes, Cancel</button>
        </div>
      </span>
    ), { duration: 5000 });
  };

  useEffect(() => {
    localStorage.setItem('b2b_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('b2b_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        setProducts([]);
      } else {
        const mappedData = data.map((p: any) => ({
          ...p,
          sku: p.sku || generateSKU(p.name, p.barcode),
          pcsPerBox: p.pcs_per_box || p.pcsPerBox || 12,
          boxPerCtn: p.box_per_ctn || p.boxPerCtn || 6
        }));
        localStorage.setItem('shaheen_b2b_products', JSON.stringify(mappedData));
        setProducts(mappedData);
      }
    } catch (err) {
      console.warn("Failed to fetch from Supabase. Using mock data for UI testing.", err);
      // Fallback for UI testing since we are using placeholders
      const cached = localStorage.getItem('shaheen_b2b_products');
      if (cached) {
        setProducts(JSON.parse(cached));
      } else {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, cartId: Date.now().toString(), quantity: 1, uom: 'Pcs', basePrice: product.price }];
    });
  };

  const updateCartQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateCartUom = (cartId: string, newUom: 'Pcs' | 'Box' | 'Ctn') => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const bp = item.basePrice || item.price;
        let multiplier = 1;
        if (newUom === 'Box') multiplier = item.pcsPerBox || 1;
        if (newUom === 'Ctn') multiplier = (item.pcsPerBox || 1) * (item.boxPerCtn || 1);
        return { ...item, uom: newUom, price: bp * multiplier };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCheckoutSuccess = () => {
    playNotificationSound();
    setIsCheckoutSuccess(true);
    setCart([]);
    setActiveTab('shop'); 
  };

  // Render Logic
  if (isCheckoutSuccess) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-[#0a0a0c] items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Package size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2 tracking-tight">Order Received!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 max-w-xs">Your wholesale order has been submitted for approval. Our team will contact you shortly.</p>
        <button 
          onClick={() => setIsCheckoutSuccess(false)}
          className="w-full max-w-sm h-10 bg-slate-900 text-slate-50 rounded-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full w-full max-w-[500px] mx-auto bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-50 font-sans print:hidden shadow-2xl sm:border-x border-slate-200 dark:border-zinc-800/50 relative">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/50 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTabState('shop')}>
           <div className="w-8 h-8 flex items-center justify-center shrink-0">
             <img src="/logo_transparent.png" alt="S" className="w-full h-full object-contain drop-shadow-sm" />
           </div>
           <div>
             <h1 className="font-bold text-[18px] leading-tight text-slate-900 dark:text-slate-50 tracking-tight hover:text-blue-600 transition-colors">Shaheen Wholesale</h1>
             <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">B2B Portal</p>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pb-32 overflow-y-auto">
        {activeTab === 'shop' && (
          <div className="p-4">
             {/* Search Bar */}
             <div className="relative mb-6">
               <div className="flex items-center bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-4 py-2.5 shadow-sm focus-within:border-blue-500 transition-all">
                 <Search className="text-slate-400 mr-3" size={18} />
                 <input 
                   type="text" 
                   placeholder="Search products or categories..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   className="bg-transparent border-none outline-none text-[14px] w-full text-slate-900 dark:text-slate-50 placeholder:text-slate-400 font-medium"
                 />
               </div>
             </div>

             {/* Product List */}
             {isLoading ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-slide-up">
                 {[...Array(8)].map((_, i) => (
                   <div key={i} className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg p-3 shadow-sm flex flex-col justify-between gap-3 h-28">
                      <div className="flex flex-col gap-2">
                        <Skeleton width="40%" height="10px" />
                        <Skeleton width="80%" height="14px" />
                      </div>
                      <div className="flex justify-between items-end mt-auto pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                        <Skeleton width="40%" height="15px" />
                        <Skeleton width="50px" height="24px" className="!rounded-lg" />
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
                  <div className="grid grid-cols-2 gap-3">
                   {filteredProducts.map(product => (
                     <div 
                       key={product.id} 
                       onClick={() => addToCart(product)}
                       className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 flex flex-col justify-between cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-all active:scale-[0.98] group text-left"
                     >
                        <div className="w-full">
                           <h4 className="font-semibold text-slate-800 dark:text-slate-200 leading-tight mb-1 text-sm truncate w-full">{product.name}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3 truncate w-full">{product.barcode || "\u00A0"}</p>
                        </div>
                        <div className="mt-auto w-full flex justify-between items-center">
                           <span className="font-bold text-slate-900 dark:text-slate-50 text-[14px]">Rs {product.price.toLocaleString()}</span>
                           <button 
                             onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                             }}
                             className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0 text-[11px] active:scale-95"
                           >
                             + Add
                           </button>
                        </div>
                     </div>
                   ))}
                   {filteredProducts.length === 0 && (
                     <div className="col-span-full text-center py-10 text-slate-400 font-medium">
                       No products found.
                     </div>
                   )}
                 </div>
               )}
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="p-4 h-full flex flex-col">
             <div className="flex items-center gap-3 mb-4 shrink-0">
               <button onClick={() => setActiveTab('shop')} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 transition-colors p-1 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded shadow-sm border border-slate-200 dark:border-zinc-800/50">
                 <ArrowRight size={20} className="rotate-180" />
               </button>
               <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Your Cart</h2>
             </div>
             {cart.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-500 pb-20">
                 <ShoppingCart size={48} className="mb-4 opacity-20" />
                 <p className="font-medium text-[15px]">Your cart is empty</p>
               </div>
             ) : (
               <div className="flex flex-col gap-3 mb-6 flex-1">
                 {cart.map(item => (
                   <div key={item.cartId} className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-xl p-3 flex flex-col gap-2">
                     <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-[13px] w-3/4 leading-tight truncate">{item.name}</h3>
                        <span className="font-bold text-blue-500 dark:text-blue-400 font-mono text-[13px]">Rs {(item.price * item.quantity).toLocaleString()}</span>
                     </div>
                     {(() => {
                        const currentProduct = products.find(p => p.id === item.id);
                        const pcsPerBox = item.pcsPerBox || currentProduct?.pcsPerBox || 12;
                        const boxPerCtn = item.boxPerCtn || currentProduct?.boxPerCtn || 6;
                        return (
                           <div className="flex justify-between items-center mt-1 border-t border-slate-700/50 pt-2">
                              <span className="text-[11px] text-slate-500 font-semibold font-mono">Rs {item.price.toLocaleString()} / {item.uom || 'each'}</span>
                              <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-lg p-0.5 h-7">
                                 <select 
                                   value={item.uom || 'Pcs'}
                                   onChange={(e) => updateCartUom(item.cartId, e.target.value as any)}
                                   className="bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-2 mr-1 pr-1 focus:outline-none cursor-pointer appearance-none"
                                 >
                                   <option value="Pcs">Pcs</option>
                                   {pcsPerBox && <option value="Box">Box</option>}
                                   {pcsPerBox && boxPerCtn && <option value="Ctn">Ctn</option>}
                                 </select>
                           <button 
                             onClick={() => updateCartQuantity(item.cartId, -1)}
                             className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50 rounded-md transition-colors text-sm leading-none"
                           >−</button>
                           <span className="w-8 bg-transparent text-center font-semibold text-slate-900 dark:text-slate-50 text-[13px]">{item.quantity}</span>
                           <button 
                             onClick={() => updateCartQuantity(item.cartId, 1)}
                             className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-50 rounded-md transition-colors text-sm leading-none"
                           >+</button>
                        </div>
                     </div>
                        );
                     })()}
                   </div>
                 ))}
               </div>
             )}

              {cart.length > 0 && (
               <div className="mt-auto md:sticky md:bottom-0 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800/50 p-4 shadow-2xl mb-4 md:mb-0 -mx-4 md:mx-0 shrink-0 z-20">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-semibold text-slate-400">Total Amount</span>
                     <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50">Rs {cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('checkout')}
                    className="w-full h-10 bg-blue-600 text-white rounded-lg font-semibold text-[14px] hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-sm"
                  >
                    Proceed to Checkout <ArrowRight size={16} />
                  </button>
               </div>
             )}
          </div>
        )}

        {activeTab === 'checkout' && (
          <B2BCheckout 
            cart={cart.map(c => ({ 
              id: c.id, 
              name: c.name, 
              price: c.price, 
              basePrice: c.basePrice || c.price,
              quantity: c.quantity,
              uom: c.uom || 'Pcs',
              barcode: c.barcode,
              sku: c.sku,
              pcs_per_box: c.pcs_per_box,
              box_per_ctn: c.box_per_ctn
            }))} 
            total={cartTotal} 
            onSuccess={handleCheckoutSuccess}
            onBack={() => setActiveTab('cart')}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="p-4 flex flex-col gap-6 h-full">
            <div className="flex items-center gap-3 mt-2 shrink-0">
               <button onClick={() => setActiveTab('shop')} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-50 transition-colors p-1 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded shadow-sm border border-slate-200 dark:border-zinc-800/50">
                 <ArrowRight size={20} className="rotate-180" />
               </button>
               <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Dashboard</h2>
            </div>
            
            {(JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]').length > 0) && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-4 rounded-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                   <WifiOff size={20} />
                   <div>
                     <p className="font-bold text-base text-amber-900 dark:text-amber-100">Offline Orders Pending Sync</p>
                     <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mt-1">You have {JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]').length} order(s) waiting to be pushed to the server.</p>
                   </div>
                </div>
                <button 
                  onClick={syncOfflineOrders}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-slate-900 dark:text-slate-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Sync Now
                </button>
              </div>
            )}
            
            {deferredPrompt && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex flex-col gap-3 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-0 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col gap-1">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2"><Smartphone size={18} /> Install Shaheen App</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Add to your home screen for quick offline access without a browser.</p>
                </div>
                <button 
                  onClick={async () => {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') setDeferredPrompt(null);
                  }}
                  className="relative z-10 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                >
                  Add to Home Screen
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {localStorage.getItem('shaheen_bookerName') || 'Authenticated User'}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}')?.booker_number || 'Connected securely'}
                    {JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}')?.phone && ` • ${JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}').phone}`}
                  </p>
                </div>
              </div>
              
              {!isImpersonating && (
                <button
                  onClick={() => {
                    localStorage.removeItem('shaheen_active_booker');
                    localStorage.removeItem('shaheen_bookerName');
                    window.location.reload();
                  }}
                  className="w-full py-2.5 mt-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Order History</h3>
                <button onClick={fetchPastOrders} disabled={isRefreshing} className="text-blue-500 text-xs font-bold uppercase hover:text-blue-600 flex items-center gap-1 disabled:opacity-50">
                  {isRefreshing ? 'REFRESHING...' : 'REFRESH'} <History size={12} className={isRefreshing ? "animate-spin" : ""} />
                </button>
              </div>
              
              <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg p-2 md:p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar shadow-sm pb-8">
                {pastOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <History size={32} className="text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium text-sm">Past orders will appear here.</p>
                  </div>
                ) : (
                  pastOrders.map((order, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80 border border-slate-200 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110 pointer-events-none"></div>
                       
                       <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                               <Package size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm md:text-base">Order #{order.id?.toString().slice(-6).toUpperCase() || order.receipt_number?.toString().padStart(4, '0') || 'N/A'}</h4>
                              <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString('en-GB')} at {new Date(order.created_at).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm border shrink-0 ${
                            order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                            order.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                            order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                            order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800' :
                            'bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-900/60 backdrop-blur-md dark:text-slate-400 dark:border-zinc-800/50'
                          }`}>
                            {order.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                            {order.isOffline && <span title="Offline (Not Synced)"><WifiOff size={12} /></span>}
                            {order.status || 'PENDING'}
                          </span>
                       </div>

                       <div className="flex justify-between items-end mt-2 pt-3 border-t border-slate-700/50 relative z-10">
                         <div className="flex flex-col">
                           <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Total Amount</span>
                           <div className="flex items-baseline gap-1.5">
                             <span className="text-lg font-black text-slate-900 dark:text-slate-50 font-mono">Rs {(order.total || order.total_amount || 0).toLocaleString()}</span>
                             <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">({(order.items || []).length} items)</span>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => setSimpleViewOrder(order)}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 rounded-lg text-xs font-bold transition-colors shadow-sm"
                           >
                             <FileText size={14} /> View
                           </button>
                           {order.status === 'COMPLETED' && (
                             <button 
                               onClick={() => setPreviewOrder(order)}
                               className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50 transition-all shadow-sm"
                             >
                               <FileText size={14} /> Receipt
                             </button>
                           )}
                           {(order.status === 'PENDING' || order.status === 'PENDING_APPROVAL') && (
                             <button 
                               onClick={() => handleCancelOrder(order.id || order.receipt_number || '')}
                               className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-colors shadow-sm"
                             >
                               Cancel
                             </button>
                           )}
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 text-center pb-4">
               <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">Powered by Areeb Iqbal</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation - ALWAYS VISIBLE */}
      <div className={`mt-auto sticky bottom-0 w-full bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-900 flex justify-around items-center pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] px-2 z-30 shadow-none print:hidden shrink-0`}>
        <button 
          onClick={() => setActiveTab('shop')} 
          className={`flex flex-col items-center p-2 transition-colors flex-1 ${activeTab === 'shop' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
        >
          <Store size={20} className={activeTab === 'shop' ? 'fill-blue-500/20' : ''} />
          <span className="text-xs font-bold mt-1">Shop</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('cart')} 
          className={`flex flex-col items-center p-2 relative transition-colors flex-1 ${activeTab === 'cart' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
        >
          <div className="relative">
            <ShoppingCart size={20} className={activeTab === 'cart' ? 'fill-blue-500/20' : ''} />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm border border-blue-500 shadow-sm">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-xs font-bold mt-1">Cart</span>
        </button>
        
        <button 
          onClick={() => {
            if (cart.length > 0) setActiveTab('checkout');
            else toast.error('Please add items to your cart first.');
          }} 
          className={`flex flex-col items-center p-2 transition-colors flex-1 ${activeTab === 'checkout' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
        >
          <CreditCard size={20} className={activeTab === 'checkout' ? 'fill-blue-500/20' : ''} />
          <span className="text-xs font-bold mt-1">Checkout</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`flex flex-col items-center p-2 transition-colors flex-1 ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
        >
          <User size={20} className={activeTab === 'dashboard' ? 'fill-blue-500/20' : ''} />
          <span className="text-xs font-bold mt-1">Profile</span>
        </button>
      </div>
      </div>

      <SimpleOrderViewModal 
        isOpen={!!simpleViewOrder}
        onClose={() => setSimpleViewOrder(null)}
        order={simpleViewOrder}
      />

      {previewOrder && (
        <OrderPreviewModal
          isOpen={true}
          isDispatched={true}
          onClose={() => setPreviewOrder(null)}
          cart={previewOrder.items || []}
          total={previewOrder.total || previewOrder.total_amount || 0}
          clientName={previewOrder.client_name || previewOrder.clientName || previewOrder.shop_name || 'B2B Client'}
          paymentTerms={previewOrder.payment_terms || 'CASH'}
          draftOrderId={previewOrder.receipt_number || ('ORD-' + (previewOrder.id || '').toString().slice(-6).toUpperCase())}
          area={previewOrder.area || 'N/A'}
          bookerName={previewOrder.booker_name || JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}')?.name || 'Self'}
          contactNumber={previewOrder.client_phone || previewOrder.contact_number || previewOrder.contactNumber || 'N/A'}
          subTotal={previewOrder.subTotal || previewOrder.total || previewOrder.total_amount || 0}
        />
      )}


    </>
  );
}
