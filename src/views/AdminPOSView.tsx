import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { playNotificationSound } from '../utils/audio';
import { saveSilentBackup } from '../utils/silentBackup';
import { LayoutDashboard, ShoppingBag, Package, Settings, Search, Trash2, Printer, ScanBarcode, BarChart3, Bell, X, AlertTriangle, FileText, User, Building, Moon, Sun, Grid, ShoppingCart, CreditCard, MapPin, LogOut, ClipboardList, Menu, Users, ChevronDown, Phone, Map as MapIcon, PieChart, BookOpen } from 'lucide-react';
import ProductsView from './ProductsView';
import type { Product } from './ProductsView';
import SettingsView from "./SettingsView";
import AuthView from './AuthView';
import BookersView from './BookersView';
import TrackersView from './TrackersView';
import OrderPreviewModal from '../components/OrderPreviewModal';
import SimpleOrderViewModal from '../components/SimpleOrderViewModal';
import Receipt from '../components/Receipt';
import CameraScanner from '../components/CameraScanner';
import DashboardView from './DashboardView';
import LedgerView from './LedgerView';
import CashManagementView from './CashManagementView';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { generateOrderExcel } from '../utils/excel';
import { saveOrderBackup } from '../utils/exportManager';
import toast from 'react-hot-toast';
import { toWords } from 'number-to-words';
import { supabase } from '../lib/supabase';
import { CloudUpload } from 'lucide-react';
import { generateSKU } from './ProductsView';

interface CartItem extends Product {
  cartId: string;
  quantity: number;
  uom?: string;
}

export interface Order {
  receiptNumber: string | number;
  date: Date;
  items: CartItem[];
  total: number;
  clientName: string;
  paymentTerms: string;
  area?: string;
  bookerName?: string;
  contactNumber?: string;
  totalWords?: string;
}

export interface OurOrderItem {
  id: string;
  name: string;
  barcode: string;
  quantityNeeded: number;
}

export default function AdminPOSView() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('shaheen_products');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map((p: any) => {
      const needsNewSku = !p.sku || p.sku === p.barcode || p.sku.trim() === '';
      return {
        ...p,
        sku: needsNewSku ? generateSKU(p.name, p.barcode) : p.sku,
        pcsPerBox: p.pcsPerBox || 12,
        boxPerCtn: p.boxPerCtn || 6
      };
    });
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('shaheen_orders');
    if (saved) {
      const orders = JSON.parse(saved);
      return orders.map((o: any) => ({
        ...o,
        items: o.items.map((i: any) => ({ ...i, sku: i.sku || generateSKU(i.name, i.barcode) }))
      }));
    }
    return [];
  });
  const [ourOrderList, setOurOrderList] = useState<OurOrderItem[]>(() => {
    const saved = localStorage.getItem('shaheen_our_order');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeMenu, setActiveMenuState] = useState(() => {
    return localStorage.getItem('shaheen_admin_activeMenu') || 'Dashboard';
  });
  
  const setActiveMenu = (menu: string) => {
    setActiveMenuState(menu);
    localStorage.setItem('shaheen_admin_activeMenu', menu);
    window.history.pushState({ menu }, '', `#${menu.replace(/\s+/g, '')}`);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.menu) {
        setActiveMenuState(e.state.menu);
      } else {
        setActiveMenuState('Register');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [mobileActiveTab, setMobileActiveTab] = useState<'catalog' | 'cart' | 'checkout'>('catalog');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [lastReceiptNumber, setLastReceiptNumber] = useState('');
  const [draftOrderId, setDraftOrderId] = useState('');
  const [activeSupabaseId, setActiveSupabaseId] = useState('');
  const [viewOrderDetails, setViewOrderDetails] = useState<any>(null);
  const [receiptOrderDetails, setReceiptOrderDetails] = useState<any>(null);
  
  // B2B Wholesale Fields
  const [clientName, setClientName] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Bank Transfer');
  const [area, setArea] = useState('');
  const [bookerName, setBookerName] = useState(() => { const n = localStorage.getItem('shaheen_bookerName'); return (n && n.includes('@')) ? 'Admin' : (n || 'Admin'); });
  const [contactNumber, setContactNumber] = useState('');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('shaheen_bookerName', bookerName);
  }, [bookerName]);
  
  const [isSyncing, setIsSyncing] = useState(false);

  // ==========================================
  // PRIORITY 1: HARDENED MANUAL SYNC ENGINE
  // ==========================================
  const handleSyncToCloud = async (e?: any) => {
    if ((window as any).__wiping) return;
    const silent = e === true;
    
    if (!navigator.onLine) {
      if (!silent) toast.error('Cannot sync while offline. Please check your internet connection.');
      return;
    }

    if (!silent && '__TAURI__' in window) {
      const bp = localStorage.getItem('shaheen_backuppath');
      if (bp) {
        const { ensureBackupFolder } = await import('../utils/backupValidator');
        await ensureBackupFolder(bp, false);
      }
    }
    
    // Prevent concurrent sync loops that choke weak processors
    if (isSyncing) return; 
    
    if (!silent) setIsSyncing(true);
    
    try {
      // 1. Sync Products (Strict Upsert)
      const productsToSync = products.map(p => {
        const hasRealSku = p.sku && p.sku !== p.barcode && p.sku.trim() !== '';
        return {
          id: p.id,
          name: p.name || 'Unknown Product',
          price: p.price,
          stock: p.stock,
          barcode: p.barcode,
          sku: hasRealSku ? p.sku : generateSKU(p.name || 'Product', p.barcode || ''),
          category: p.category || null
        };
      });

      const { error: prodError } = await supabase.from('products').upsert(productsToSync, { onConflict: 'id' });
      if (prodError) throw prodError;
      
      // 2. Sync Offline Status Updates
      await syncOfflineStatusUpdates();
      
      // 3. Sync Offline Bookers
      const offlineBookers = JSON.parse(localStorage.getItem('shaheen_offline_bookers') || '[]');
      if (offlineBookers.length > 0) {
         const { error: bookerError } = await supabase.from('bookers').upsert(offlineBookers, { onConflict: 'booker_number' });
         if (!bookerError) localStorage.removeItem('shaheen_offline_bookers');
      }
      
      // 4. Handle Deleted Bookers
      const deletedBookers = JSON.parse(localStorage.getItem('shaheen_deleted_bookers') || '[]');
      if (deletedBookers.length > 0) {
         for (const bNum of deletedBookers) {
           await supabase.from('bookers').delete().eq('booker_number', bNum);
         }
         localStorage.removeItem('shaheen_deleted_bookers');
      }
      
      // 5. Pull latest state to UI securely
      await fetchOrders();
      await pullBookersFromCloud();
      await pullProductsFromCloud();
      
      if (!silent) toast.success('Manual synchronization flawless and complete.');
    } catch (err: any) {
      console.error('Sync error:', err);
      if (!silent) toast.error('Failed to sync to cloud: ' + err.message);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Background Auto-Sync every 5 seconds (Silent Mode)
  const syncRef = useRef(handleSyncToCloud);
  useEffect(() => {
    syncRef.current = handleSyncToCloud;
  });
  useEffect(() => {
    const timer = setInterval(() => {
      if (syncRef.current) syncRef.current(true);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  
  // Light Mode Engine (Forced)
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('shaheen_dark_mode', 'false');
    document.documentElement.classList.remove('dark');
  }, []);

  // Silent Autosave Engine
  useEffect(() => {
    localStorage.setItem('shaheen_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shaheen_orders', JSON.stringify(pastOrders));
  }, [pastOrders]);

  // Auto-pull products from Supabase on mount (cross-device sync)
  const pullProductsFromCloud = useCallback(async () => {
    try {
      const { data: cloudProducts, error } = await supabase.from('products').select('*');
      if (error || !cloudProducts) return;
      
      setProducts(prev => {
        const localById = new Map(prev.map(p => [p.id, p]));
        const merged = [...prev];
        for (const cp of cloudProducts) {
          const hasRealSku = cp.sku && cp.sku !== cp.barcode && cp.sku.trim() !== '';
          const localProduct = localById.get(cp.id);
          const mapped = {
            ...cp,
            name: cp.name || localProduct?.name || 'Unknown Product',
            sku: hasRealSku ? cp.sku : (localProduct?.sku && localProduct.sku !== localProduct.barcode ? localProduct.sku : generateSKU(cp.name || 'Product', cp.barcode)),
            pcsPerBox: cp.pcs_per_box || cp.pcsPerBox || localProduct?.pcsPerBox || 12,
            boxPerCtn: cp.box_per_ctn || cp.boxPerCtn || localProduct?.boxPerCtn || 6
          };
          if (localById.has(cp.id)) {
            const idx = merged.findIndex(p => p.id === cp.id);
            if (idx !== -1) merged[idx] = { ...merged[idx], ...mapped };
          } else {
            merged.push(mapped);
          }
        }
        return merged;
      });
    } catch (err) {
      console.warn('Failed to pull products from cloud:', err);
    }
  }, []);

  const pullBookersFromCloud = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('bookers').select('*').order('created_at', { ascending: false });
      if (error || !data) return;
      localStorage.setItem('shaheen_bookers', JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to pull bookers from cloud:', err);
    }
  }, []);

  useEffect(() => {
    pullProductsFromCloud();
    pullBookersFromCloud();
  }, [pullProductsFromCloud, pullBookersFromCloud]);

  useEffect(() => {
    localStorage.setItem('shaheen_our_order', JSON.stringify(ourOrderList));
  }, [ourOrderList]);

  const handleAddToOurOrder = useCallback((product: Product | CartItem, quantityNeeded: number) => {
    setOurOrderList(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantityNeeded: i.quantityNeeded + quantityNeeded } : i);
      }
      return [...prev, { id: product.id, name: product.name, barcode: product.barcode || '', quantityNeeded }];
    });
    toast.success(`Added ${quantityNeeded} of ${product.name} to Our Order list.`);
  }, []);

  // Enterprise USB Hardware Backup
  useEffect(() => {
    const drive = localStorage.getItem('shaheen_usbdrive');
    if (drive && window.electronAPI) {
      window.electronAPI.saveBackup(drive, {
        products,
        pastOrders
      }).catch(err => console.error('Failed to write USB backup:', err));
    }
  }, [products, pastOrders]);

  // Alerts System
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [registerSearchQuery, setRegisterSearchQuery] = useState('');
  
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Focus ref for the hidden scanner input
  const hiddenScannerRef = useRef<HTMLInputElement>(null);
  const [isScannerFocused, setIsScannerFocused] = useState(true);

  // ==========================================
  // PRIORITY 3: CPU OPTIMIZATIONS (MOBILE)
  // ==========================================
  const calculateItemPrice = useCallback((item: CartItem) => {
    return item.price * item.quantity;
  }, []);

  // Prevent subtotal loop freezing on weak CPUs
  const subTotal = useMemo(() => cart.reduce((sum, item) => sum + calculateItemPrice(item), 0), [cart, calculateItemPrice]);
  const tax = 0; 
  const total = useMemo(() => subTotal + tax, [subTotal, tax]);

  // Incoming Orders System
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [permanentlyHiddenOrders, setPermanentlyHiddenOrders] = useState<string[]>([]);
  const [autoBackedUpOrders, setAutoBackedUpOrders] = useState<string[]>([]);

  // Automated PC Background Sync
  useEffect(() => {
    const isTauri = '__TAURI__' in window;
    if (!isTauri || incomingOrders.length === 0) return;

    let autoBackedUp: string[] = [];
    try {
      autoBackedUp = JSON.parse(localStorage.getItem('shaheen_auto_backed_up') || '[]');
    } catch {
      autoBackedUp = [];
    }
    
    setAutoBackedUpOrders(autoBackedUp);
    let hasNewBackups = false;

    incomingOrders.forEach(async (order) => {
      const orderId = order.receipt_number || order.id;
      if (orderId && !autoBackedUp.includes(orderId.toString())) {
        autoBackedUp.push(orderId.toString());
        hasNewBackups = true;
        
        const details = {
          clientName: order.client_name,
          area: order.area,
          contactNumber: order.contact_number,
          bookerName: order.booker_name,
          total: order.total
        };
        
        try {
          await saveOrderBackup(orderId.toString(), order.items || [], details);
          toast.success(`Auto-backed up ${orderId} to PC.`);
          
          supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', order.id || orderId).then(({ error }) => {
            if (error) console.error("Failed to complete auto-backed up order in Supabase:", error);
          });
          
          setPermanentlyHiddenOrders(prev => [...prev, orderId.toString()]);
          
          const newPastOrder: Order = {
            receiptNumber: order.receipt_number || order.id,
            date: new Date(order.created_at || new Date()),
            items: order.items || [],
            clientName: order.client_name,
            area: order.area,
            contactNumber: order.contact_number,
            bookerName: order.booker_name,
            total: order.total
          };
          setPastOrders(prev => {
             if (prev.some(p => p.receiptNumber === newPastOrder.receiptNumber)) return prev;
             return [newPastOrder, ...prev];
          });
          
        } catch (e) {
          console.error(`Auto backup failed for ${orderId}:`, e);
        }
      }
    });

    if (hasNewBackups) {
      localStorage.setItem('shaheen_auto_backed_up', JSON.stringify(autoBackedUp));
      setAutoBackedUpOrders([...autoBackedUp]);
    }
  }, [incomingOrders]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['PENDING', 'ACCEPTED', 'PROCESSING'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      let allOrders = data || [];
      
      allOrders = allOrders.map((o: any) => ({
        ...o,
        items: (o.items || []).map((i: any) => ({ ...i, sku: i.sku || generateSKU(i.name, i.barcode) }))
      }));
        
      const statusQueue = JSON.parse(localStorage.getItem('shaheen_offline_status_updates') || '[]');
      if (statusQueue.length > 0) {
         const hiddenIds = statusQueue
           .filter((u: any) => u.status === 'COMPLETED' || u.status === 'CANCELLED')
           .map((u: any) => u.id);
         allOrders = allOrders.filter((o: any) => !hiddenIds.includes(o.id));
      }

      const offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
      if (offlineOrders.length > 0) {
        let pendingOffline = offlineOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PROCESSING');
        if (statusQueue.length > 0) {
           const hiddenIds = statusQueue
             .filter((u: any) => u.status === 'COMPLETED' || u.status === 'CANCELLED')
             .map((u: any) => u.id);
           pendingOffline = pendingOffline.filter((o: any) => !hiddenIds.includes(o.id) && !hiddenIds.includes(o.receipt_number));
        }
        
        pendingOffline = pendingOffline.map((o: any) => ({
          ...o,
          items: (o.items || []).map((i: any) => ({ ...i, sku: i.sku || generateSKU(i.name, i.barcode) }))
        }));
        const existingIds = new Set(allOrders.map((o: any) => o.id).filter(Boolean));
        const existingReceipts = new Set(allOrders.map((o: any) => o.receipt_number).filter(Boolean));
        
        pendingOffline = pendingOffline.filter((o: any) => 
           !(o.id && existingIds.has(o.id)) && !(o.receipt_number && existingReceipts.has(o.receipt_number))
        );
        
        allOrders = [...pendingOffline, ...allOrders];
      }
      
      setIncomingOrders(allOrders.filter((o: any) => !permanentlyHiddenOrders.includes(o.id) && !permanentlyHiddenOrders.includes(o.receipt_number)));
    } catch (err) {
      console.warn('Failed to fetch from Supabase, loading local orders instead:', err);
      const offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
      let pendingOffline = offlineOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PROCESSING');
      const formattedOffline = pendingOffline.map((o: any) => ({
        ...o,
        items: (o.items || []).map((i: any) => ({ ...i, sku: i.sku || generateSKU(i.name, i.barcode) }))
      }));
      setIncomingOrders(formattedOffline.filter((o: any) => !permanentlyHiddenOrders.includes(o.id) && !permanentlyHiddenOrders.includes(o.receipt_number)));
    }
  };

  useEffect(() => {
    if (permanentlyHiddenOrders.length > 0) {
      setIncomingOrders(prev => prev.filter(o => !permanentlyHiddenOrders.includes(o.id) && !permanentlyHiddenOrders.includes(o.receipt_number)));
    }
  }, [permanentlyHiddenOrders]);

  const syncOfflineStatusUpdates = async () => {
    const queue = JSON.parse(localStorage.getItem('shaheen_offline_status_updates') || '[]');
    if (queue.length === 0 || !navigator.onLine) return;

    const failed: any[] = [];
    for (const update of queue) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: update.status })
          .eq('id', update.id);
        if (error && error.code !== '23505' && error.code !== '42501' && error.code !== '22P02') {
          failed.push(update);
        }
      } catch (err) {
        failed.push(update);
      }
    }

    if (failed.length === 0) {
      localStorage.removeItem('shaheen_offline_status_updates');
    } else {
      localStorage.setItem('shaheen_offline_status_updates', JSON.stringify(failed));
    }
  };

  useEffect(() => {
    fetchOrders();
    syncOfflineStatusUpdates();

    const handleOnline = () => {
      syncOfflineStatusUpdates();
      pullProductsFromCloud();
      pullBookersFromCloud();
    };
    window.addEventListener('online', handleOnline);

    const ordersChannel = supabase.channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
          }
          fetchOrders();
        }
      )
      .subscribe();

    const productsChannel = supabase.channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          pullProductsFromCloud();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const handleAcknowledgeOrder = useCallback(async (order: any) => {
    try {
      if (order.id) {
        const { error } = await supabase.from('orders').update({ status: 'ACCEPTED' }).eq('id', order.id);
        if (error) throw error;
      } else {
        throw new Error('Offline order, skipping Supabase');
      }
      setIncomingOrders(prev => prev.map(o => (o.id && o.id === order.id) ? { ...o, status: 'ACCEPTED' } : o));
    } catch (err: any) {
      console.warn('Supabase update failed, updating local order:', err);
      let offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
      const orderIndex = offlineOrders.findIndex((o: any) => (order.id && o.id === order.id) || (order.receipt_number && o.receipt_number === order.receipt_number));
      if (orderIndex !== -1) {
         offlineOrders[orderIndex].status = 'ACCEPTED';
         localStorage.setItem('shaheen_offline_orders', JSON.stringify(offlineOrders));
      }
      setIncomingOrders(prev => prev.map(o => ((order.id && o.id === order.id) || (order.receipt_number && o.receipt_number === order.receipt_number)) ? { ...o, status: 'ACCEPTED' } : o));
    }
  }, []);

  const handleCancelIncomingOrder = useCallback(async (order: any) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        <span className="font-semibold text-slate-900">Cancel this order?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold" 
            onClick={() => toast.dismiss(t.id)}
          >No</button>
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                if (order.id) {
                   await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
                } else if (order.receipt_number) {
                   let offline = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
                   let idx = offline.findIndex((o: any) => o.receipt_number === order.receipt_number);
                   if (idx !== -1) {
                      offline[idx].status = 'CANCELLED';
                      localStorage.setItem('shaheen_offline_orders', JSON.stringify(offline));
                   }
                }
                setIncomingOrders(prev => prev.filter(o => o.id !== order.id && o.receipt_number !== order.receipt_number));
                setPermanentlyHiddenOrders(prev => [...prev, order.id || order.receipt_number]);
                
                const cancelled = JSON.parse(localStorage.getItem('shaheen_cancelled_orders') || '[]');
                cancelled.push({ ...order, cancelledAt: new Date().toISOString() });
                localStorage.setItem('shaheen_cancelled_orders', JSON.stringify(cancelled));
                
                toast.success('Order Cancelled');
              } catch (e: any) {
                toast.error('Failed to cancel order: ' + e.message);
              }
            }}
          >Yes, Cancel</button>
        </div>
      </span>
    ), { duration: 5000 });
  }, []);

  const handleRestoreOrder = useCallback(async (order: any) => {
    try {
      if (order.id) {
        await supabase.from('orders').update({ status: 'PENDING' }).eq('id', order.id);
      } else if (order.receipt_number) {
        let offline = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
        let idx = offline.findIndex((o: any) => o.receipt_number === order.receipt_number);
        if (idx !== -1) {
          offline[idx].status = 'PENDING';
          localStorage.setItem('shaheen_offline_orders', JSON.stringify(offline));
        }
      }
      
      let cancelled = JSON.parse(localStorage.getItem('shaheen_cancelled_orders') || '[]');
      cancelled = cancelled.filter((o: any) => {
        const id1 = String(order.id || '').toLowerCase();
        const id2 = String(o.id || '').toLowerCase();
        const r1 = String(order.receipt_number || order.receiptNumber || '').toLowerCase();
        const r2 = String(o.receipt_number || o.receiptNumber || '').toLowerCase();
        
        if (id1 && id2 && id1 === id2) return false;
        if (r1 && r2 && r1 === r2) return false;
        return true;
      });
      localStorage.setItem('shaheen_cancelled_orders', JSON.stringify(cancelled));
      
      setPermanentlyHiddenOrders(prev => prev.filter(id => id !== order.id && id !== order.receipt_number));
      setIncomingOrders(prev => [{...order, status: 'PENDING'}, ...prev]);
      
      toast.success('Order Restored to Queue');
    } catch (e: any) {
      toast.error('Failed to restore order: ' + e.message);
    }
  }, []);

  const handleAcceptOrder = useCallback(async (order: any) => {
    const receiptNumber = order.receipt_number || order.id;
    
    setActiveSupabaseId(order.id || '');
    setDraftOrderId(receiptNumber);
    
    const loadedCart: CartItem[] = (order.items || []).map((item: any) => {
      const matchedProduct = products.find(p => p.id === item.id);
      return {
        id: item.id,
        name: item.name || matchedProduct?.name || 'Unknown Product',
        price: item.price || matchedProduct?.price || 0,
        basePrice: item.basePrice || matchedProduct?.price || item.price || 0,
        stock: matchedProduct?.stock || 0,
        barcode: item.barcode || matchedProduct?.barcode || '',
        sku: item.sku || matchedProduct?.sku || '',
        category: item.category || matchedProduct?.category || '',
        cartId: Date.now().toString() + Math.random(),
        quantity: item.quantity,
        uom: item.uom || 'Pcs'
      };
    });
    
    setCart(loadedCart);
    setClientName(order.client_name || 'B2B Customer');
    setPaymentTerms(order.payment_terms || 'Cash on Delivery');
    setArea(order.area || '');
    setBookerName(order.booker_name || '');
    setContactNumber(order.client_phone || order.contact_number || order.contactNumber || '');
    setIsCheckoutSuccess(false);
    
    setActiveMenu('Register');
    setMobileActiveTab('cart');
    
    toast.success('Cart pre-filled! Please finalize and dispatch.');
  }, [products]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, cartId: Date.now().toString() + Math.random(), quantity: 1, uom: 'Pcs', basePrice: product.price }];
    });
  }, []);

  const handleScan = useCallback((scannedBarcode: string) => {
    const product = products.find(p => p.barcode === scannedBarcode);
    if (product) {
      addToCart(product);
    }
  }, [products, addToCart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          handleScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => { barcodeBuffer.current = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScan]); 

  useEffect(() => {
    if (activeMenu === 'Register' && !isAlertDrawerOpen) {
      hiddenScannerRef.current?.focus();
    }
  }, [activeMenu, isAlertDrawerOpen]);

  const filteredProducts = useMemo(() => {
    if (!registerSearchQuery.trim()) return products;
    const lowerQ = registerSearchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerQ) || p.barcode.includes(lowerQ));
  }, [products, registerSearchQuery]);

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  }, []);

  const handleClearAll = useCallback(() => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        <span className="font-semibold text-slate-900">Clear the entire order?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >No</button>
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
            onClick={() => {
              toast.dismiss(t.id);
              setCart([]);
              setClientName('');
              setPaymentTerms('Bank Transfer');
              setBookerName('');
              setContactNumber('');
              setArea('');
              setIsCheckoutSuccess(false);
              setLastReceiptNumber('');
              setDraftOrderId('');
              setActiveSupabaseId('');
            }}
          >Yes, Clear</button>
        </div>
      </span>
    ), { duration: 5000 });
  }, []);

  const handleStartNewOrder = useCallback(() => {
      setCart([]);
      setClientName('');
      setPaymentTerms('Bank Transfer');
      setBookerName('');
      setContactNumber('');
      setArea('');
      setIsCheckoutSuccess(false);
      setLastReceiptNumber('');
      setDraftOrderId('');
      setActiveSupabaseId('');
      setTimeout(() => hiddenScannerRef.current?.focus(), 100);
  }, []);

  const updateCartItem = useCallback((cartId: string, updates: Partial<CartItem>) => {
    if (updates.quantity !== undefined && updates.quantity <= 0) {
      removeFromCart(cartId);
      return;
    }
    if (updates.quantity !== undefined) {
      updates.quantity = Math.floor(updates.quantity);
    }
    
    setCart(prev => prev.map(item => {
      if (item.cartId !== cartId) return item;
      let newItem = { ...item, ...updates };
      
      if (updates.uom) {
         const product = products.find(p => p.id === item.id || p.barcode === item.barcode);
         if (product) {
            let multiplier = 1;
            if (updates.uom === 'Box') multiplier = product.pcsPerBox || 1;
            if (updates.uom === 'Ctn') multiplier = (product.pcsPerBox || 1) * (product.boxPerCtn || 1);
            newItem.price = (newItem.basePrice || product.price) * multiplier;
         }
      }
      return newItem;
    }));
  }, [products, removeFromCart]);

  const handlePrintReceipt = useCallback(() => {
    if (cart.length === 0) { toast.error('Cart is empty.'); return; }
    if (!clientName.trim()) { toast.error('Please enter Client / Business Name.'); return; }
    if (!area.trim()) { toast.error('Please enter Area Name.'); return; }
    if (!contactNumber.trim()) { toast.error('Please enter Contact Number.'); return; }
    if (!bookerName.trim()) { toast.error('Please enter Booker Name.'); return; }

    if (!draftOrderId) {
      setDraftOrderId('ORD-' + Math.floor(100000 + Math.random() * 900000));
    }

    const insufficientItems = cart.filter(item => {
      const product = products.find(p => p.barcode === item.barcode || p.id === item.id);
      let multiplier = 1;
      if (item.uom === 'Box') multiplier = product?.pcsPerBox || 1;
      if (item.uom === 'Ctn') multiplier = (product?.pcsPerBox || 1) * (product?.boxPerCtn || 1);
      
      const requiredQty = item.quantity * multiplier;
      return (product?.stock || 0) < requiredQty;
    });

    if (insufficientItems.length > 0) {
      const itemNames = insufficientItems.map(i => i.name).join(', ');
      toast.error(`Insufficient stock for: ${itemNames}. Please restock inventory first.`);
      return; 
    }

    setIsReceiptOpen(true);
  }, [cart, clientName, area, contactNumber, bookerName, draftOrderId, products]);

  const handleCloseReceipt = useCallback(() => {
    setIsReceiptOpen(false);
    setTimeout(() => hiddenScannerRef.current?.focus(), 100);
  }, []);

  const handleDispatch = useCallback(async () => {
    if (isSubmitting) return false;
    setIsSubmitting(true);

    try {
      const totalWords = toWords(total).toUpperCase() + ' RUPEES ONLY';
      
      const orderData = {
        items: cart,
        total,
        clientName: clientName.trim(),
        paymentTerms,
        area,
        bookerName, 
        contactNumber,
        totalWords
      };

      const newOrder: Order = {
        receiptNumber: draftOrderId,
        date: new Date(),
        ...orderData
      };

      if (window.__TAURI__) {
        saveSilentBackup(newOrder).catch(err => console.error("Silent backup failed:", err));
      }

      if (window.electronAPI?.dispatchOrder) {
        const res = await window.electronAPI.dispatchOrder(orderData);
        if (res?.success) {
          setPastOrders(prev => [{ receiptNumber: res.orderId, date: new Date(), ...orderData }, ...prev]);
          setLastReceiptNumber(res.orderId);
          setIsCheckoutSuccess(true);
          setIsSubmitting(false);
          return true;
        } else {
          toast.error("Dispatch failed: " + res?.error);
          setIsSubmitting(false);
          return false;
        }
      } else {
        setPastOrders(prev => [newOrder, ...prev]);
        setLastReceiptNumber(newOrder.receiptNumber as string);

        try {
          if (window.__TAURI__) {
            const printerIp = localStorage.getItem('shaheen_printer_ip') || '192.168.1.100';
            await window.__TAURI__.invoke('print_receipt_tcp', { printerIp, payload: orderData });
          }
        } catch (e) {
          console.error("Hardware print failed:", e);
        }

        const updatedProducts = products.map(p => {
          const cartItem = cart.find(c => c.id === p.id);
          if (cartItem) {
            let multiplier = 1;
            if (cartItem.uom === 'Box') multiplier = p.pcsPerBox || 1;
            if (cartItem.uom === 'Ctn') multiplier = (p.pcsPerBox || 1) * (p.boxPerCtn || 1);
            return { ...p, stock: Math.max(0, p.stock - (cartItem.quantity * multiplier)) };
          }
          return p;
        });
        setProducts(updatedProducts);

        if (draftOrderId) {
          if (activeSupabaseId) {
            try {
              await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', activeSupabaseId);
            } catch (err) {
              console.warn("Supabase update failed:", err);
            }
          }
          let offlineOrders = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
          const orderIndex = offlineOrders.findIndex((o: any) => o.id === draftOrderId || o.receipt_number === draftOrderId);
          if (orderIndex !== -1) {
            offlineOrders[orderIndex].status = 'COMPLETED';
            localStorage.setItem('shaheen_offline_orders', JSON.stringify(offlineOrders));
          }
        }
        setIsCheckoutSuccess(true);
        setIsSubmitting(false);
        return true;
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during dispatch.");
      setIsSubmitting(false);
      return false;
    }
  }, [isSubmitting, total, cart, clientName, paymentTerms, area, bookerName, contactNumber, draftOrderId, products, activeSupabaseId]);

  const minStockDict = useMemo(() => JSON.parse(localStorage.getItem('shaheen_min_stock') || '{}'), []);
  const hasCriticalStock = useMemo(() => products.some(p => p.stock <= (minStockDict[p.id] ?? 5)), [products, minStockDict]);

  const sidebarItems = [
    { name: 'Register', icon: <LayoutDashboard size={22} /> },
    { name: 'Dashboard', icon: <PieChart size={22} /> },
    { name: 'Inventory', icon: <Package size={22} />, hasAlert: hasCriticalStock },
    { name: 'Bookers', icon: <Users size={22} /> },
    { name: 'Our Order', icon: <ClipboardList size={22} /> },
    { name: 'Ledger', icon: <BookOpen size={22} /> },
  ];

  const unhandledOutOfStockItems = useMemo(() => cart.filter(item => {
    const product = products.find(p => p.barcode === item.barcode || p.id === item.id);
    const stockAvailable = product?.stock || 0;
    const deficit = item.quantity - stockAvailable;
    const alreadyInOurOrder = ourOrderList.find(o => o.id === item.id);
    return deficit > 0 && !alreadyInOurOrder;
  }), [cart, products, ourOrderList]);

  const scrollToFirstOutOfStock = useCallback(() => {
    if (unhandledOutOfStockItems.length > 0) {
      const element = document.getElementById(`cart-item-${unhandledOutOfStockItems[0].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [unhandledOutOfStockItems]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'Dashboard':
        return <DashboardView pastOrders={pastOrders} products={products} onRestoreOrder={handleRestoreOrder} />;
      case 'Ledger':
        return <LedgerView pastOrders={pastOrders} />;
      case 'Trackers':
        return <TrackersView />;
      case 'Inventory':
        return <ProductsView products={products} setProducts={setProducts} />;
      case 'Bookers':
        return <BookersView />;
      case 'Our Order':
        return (
          <div className="p-8 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto">
             <div className="flex justify-between items-center mb-8 shrink-0">
               <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Purchase / Our Order</h1>
               {ourOrderList.length > 0 && (
                 <button onClick={() => {
                   toast((t) => (
                     <span className="flex flex-col gap-2">
                       <span className="font-semibold text-slate-900">Clear the entire list?</span>
                       <div className="flex gap-2 justify-end mt-2">
                         <button 
                           className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
                           onClick={() => toast.dismiss(t.id)}
                         >No</button>
                         <button 
                           className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                           onClick={() => {
                             toast.dismiss(t.id);
                             setOurOrderList([]);
                           }}
                         >Yes, Clear</button>
                       </div>
                     </span>
                   ), { duration: 5000 });
                 }} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold text-sm hover:bg-red-700 shadow-sm transition-colors">
                   Clear List
                 </button>
               )}
             </div>
             
             <div className="flex-1 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800/50 overflow-hidden flex flex-col">
               {ourOrderList.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400">
                   <Package size={48} className="mb-4 opacity-20" />
                   <p className="text-lg font-medium">No items needed yet.</p>
                 </div>
               ) : (
                 <div className="overflow-y-auto overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse text-sm">
                   <thead>
                     <tr className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                       <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50">Product Name</th>
                       <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50">Barcode</th>
                       <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50 text-center">Qty Needed</th>
                       <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {ourOrderList.map(item => (
                       <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                         <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">{item.name}</td>
                         <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.barcode}</td>
                         <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold text-center">{item.quantityNeeded}</td>
                         <td className="py-3 px-4 text-right">
                           <button onClick={() => setOurOrderList(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-sm">
                             Remove
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 </div>
               )}
             </div>
          </div>
        );
      case 'Orders': 
        return (
          <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Incoming B2B Orders</h2>
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
                {incomingOrders.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                    <Package size={48} className="mb-4 opacity-20" />
                    <p className="text-[15px] font-medium text-center">No new incoming orders right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {incomingOrders.map((order, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.98]">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110 pointer-events-none"></div>
                         <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">{order.client_name || 'B2B Client'}</span>
                            <div className="flex gap-2">
                              {autoBackedUpOrders.includes((order.id || order.receipt_number)?.toString()) && (
                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                  PC BACKED UP
                                </span>
                              )}
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                                NEW
                              </span>
                            </div>
                         </div>
                         <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                            <span className="flex items-center gap-1"><MapPin size={12} /> Area: {order.area || 'N/A'}</span>
                            <span className="flex items-center gap-1"><User size={12} /> Booker: {order.booker_name || 'N/A'}</span>
                            <span className="flex items-center gap-1"><CreditCard size={12} /> Terms: {order.payment_terms || 'Cash'}</span>
                             <span className="flex items-center gap-1"><Phone size={12} /> Phone: {order.client_phone || order.contact_number || order.contactNumber || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-zinc-800/50 pt-3 relative z-10">
                            <span className="text-slate-800 dark:text-slate-200 font-bold text-lg">Rs {(order.total || 0).toLocaleString()}</span>
                            <div className="flex gap-2">
                              {order.status === 'PENDING' ? (
                                <button 
                                  onClick={() => handleAcknowledgeOrder(order)}
                                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                                >
                                  Order Received
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => setViewOrderDetails(order)}
                                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    View
                                  </button>
                                  <button 
                                    onClick={() => handleAcceptOrder(order)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    Auto Make
                                  </button>
                                  <button 
                                    onClick={() => handleCancelIncomingOrder(order)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
        </div>
          </div>
        );
      case 'Settings': 
        return <SettingsView />;
      case 'Register':
      default:
        return (
          <div className="flex flex-1 flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-[#0a0a0c]">
            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Center-Left Column: Product Catalog */}
              <div className={`${mobileActiveTab === 'catalog' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-slate-50 dark:bg-[#0a0a0c] min-w-0`}>
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                  
                  {/* Hidden Scanner Input */}
                  <input 
                    ref={hiddenScannerRef}
                    className="opacity-0 absolute top-0 left-0 w-1 h-1"
                    onFocus={() => setIsScannerFocused(true)}
                    onBlur={() => setIsScannerFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleScan(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />

                  <div className="flex justify-between items-center shrink-0 p-4 md:p-6 pb-4 gap-3 md:gap-6">
                    <div className="shrink-0">
                      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Register</h1>
                    </div>

                    <div className="flex items-center bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm px-4 py-2.5 flex-1 max-w-[420px] shadow-sm focus-within:ring-1 ring-slate-400 transition-all">
                      <Search size={18} className="text-slate-400 mr-3 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Search or scan..."
                        value={registerSearchQuery}
                        onChange={(e) => setRegisterSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              const product = products.find(p => p.barcode === val);
                              if (product) {
                                handleScan(val);
                                setRegisterSearchQuery('');
                              } else if (filteredProducts.length === 1) {
                                addToCart(filteredProducts[0]);
                                setRegisterSearchQuery('');
                              }
                            }
                          }
                        }}
                        className="w-full bg-transparent border-none outline-none text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 min-w-0 text-ellipsis"
                      />
                      <button 
                          onClick={() => setIsCameraOpen(true)}
                          className="p-1 rounded-sm focus:outline-none bg-white dark:bg-zinc-900/60 backdrop-blur-md shrink-0"
                          title="Open Camera Scanner"
                        >
                          <ScanBarcode size={22} className={`${isScannerFocused ? 'text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]' : 'text-red-500'} transition-all`} />
                        </button>
                    </div>
                  </div>

                  {/* Filtered Product Grid */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                      {filteredProducts.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => {
                            addToCart(p);
                            hiddenScannerRef.current?.focus();
                          }}
                          className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 flex flex-col items-start hover:border-slate-400 transition-all text-left"
                        >
                          <h4 className="font-semibold text-slate-800 dark:text-slate-200 leading-tight mb-1 text-sm truncate w-full">{p.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-3">{p.barcode}</p>
                          <div className="mt-auto w-full flex justify-between items-center">
                            <span className="font-bold text-slate-900 dark:text-slate-50 text-[15px]">Rs {p.price}</span>
                            <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-sm truncate">Stock: {p.stock}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center-Right Column: Cart Items */}
              <div className={`${mobileActiveTab === 'cart' ? 'flex' : 'hidden'} md:flex w-full md:w-[22rem] shrink-0 border-l border-slate-200 dark:border-zinc-800/50 flex-col h-full bg-white dark:bg-zinc-900/60 backdrop-blur-md z-10`}>
                <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0c]/50 shrink-0">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Cart Items</h2>
                  <div className="flex items-center gap-2">
                    {unhandledOutOfStockItems.length > 0 && (
                      <button 
                        onClick={scrollToFirstOutOfStock}
                        className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-sm text-xs font-bold border border-red-200 dark:border-red-900/50 hover:bg-red-200 transition-colors"
                        title="View out of stock items"
                      >
                        <AlertTriangle size={12} />
                        {unhandledOutOfStockItems.length}
                      </button>
                    )}
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-sm text-xs font-bold border border-slate-200 dark:border-zinc-800/50">
                      {cart.length} units
                    </span>
                    {cart.length > 0 && !isCheckoutSuccess && (
                      <button 
                        onClick={handleClearAll} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:bg-red-900/30 p-1 rounded-sm transition-colors" 
                        title="Clear All"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-[#0a0a0c]/30 relative">
                  {cart.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 p-8">
                        <ShoppingBag size={48} className="opacity-30 text-slate-400" />
                        <p className="text-sm font-medium text-center">Scan or select items</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                        {cart.map((item, idx) => {
                          const currentProduct = products.find(p => p.id === item.id);
                          const stockAvailable = currentProduct?.stock || 0;
                          const deficit = item.quantity - stockAvailable;
                          const isOutOfStock = deficit > 0;
                          
                          const itemPcsPerBox = item.pcsPerBox || (item as any).pcs_per_box || currentProduct?.pcsPerBox || (currentProduct as any)?.pcs_per_box;
                          const itemBoxPerCtn = item.boxPerCtn || (item as any).box_per_ctn || currentProduct?.boxPerCtn || (currentProduct as any)?.box_per_ctn;

                          return (
                          <div id={`cart-item-${item.id}`} className={`flex flex-col bg-white dark:bg-zinc-900/60 backdrop-blur-md border ${isOutOfStock ? 'border-red-400 dark:border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'border-slate-200 dark:border-zinc-800/50 shadow-sm'} p-3 rounded-sm group gap-2`} key={idx}>
                          <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold text-xs w-4 shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-[13px] leading-tight truncate">{item.name}</p>
                                {item.barcode && <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{item.barcode}</p>}
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.cartId)}
                                className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-2">
                              <div className="flex items-center gap-2">
                                <select 
                                  value={item.uom || 'Pcs'}
                                  onChange={e => updateCartItem(item.cartId, { uom: e.target.value })}
                                  className="bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm text-[11px] font-semibold text-slate-600 dark:text-slate-400 focus:outline-none focus:border-slate-400 h-7 px-1 outline-none"
                                >
                                  <option value="Pcs">Pcs</option>
                                  {itemPcsPerBox && <option value="Box">Box</option>}
                                  {itemPcsPerBox && itemBoxPerCtn && <option value="Ctn">Ctn</option>}
                                </select>
                                <div className="flex items-center gap-0.5 shrink-0 bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm p-0.5 h-7">
                                  <button 
                                    onClick={() => updateCartItem(item.cartId, { quantity: item.quantity - 1 })}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-800 dark:text-slate-200 rounded-sm transition-colors text-sm leading-none"
                                  >
                                    −
                                  </button>
                                  <input 
                                    type="number" 
                                    step="1"
                                    min="1"
                                    value={item.quantity} 
                                    onChange={e => {
                                      const v = e.target.value;
                                      if (v === '0') updateCartItem(item.cartId, { quantity: 0 });
                                      else updateCartItem(item.cartId, { quantity: parseInt(v, 10) || 1 });
                                    }}
                                    className="w-8 bg-transparent text-center font-semibold text-slate-700 dark:text-slate-300 focus:outline-none text-[13px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button 
                                    onClick={() => updateCartItem(item.cartId, { quantity: item.quantity + 1 })}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-800 dark:text-slate-200 rounded-sm transition-colors text-sm leading-none"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-slate-50 text-[13px]">Rs {calculateItemPrice(item).toFixed(2)}</span>
                          </div>
                          
                          {isOutOfStock && (
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-red-100 dark:border-red-900/30">
                               <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center">
                                 <AlertTriangle size={12} className="inline mr-1" />
                                 Missing {deficit} in stock
                               </span>
                               <button 
                                 onClick={() => handleAddToOurOrder(currentProduct || item, deficit)}
                                 className="text-[10px] font-bold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-1 rounded-sm hover:bg-red-200 transition-colors"
                               >
                                 Add to Our Order
                               </button>
                            </div>
                          )}
                        </div>
                        )})}
                    </div>
                  )}
                </div>
              </div>

              {/* Rightmost Column: Checkout & Actions */}
              <div className={`${mobileActiveTab === 'checkout' ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0 border-l border-slate-200 dark:border-zinc-800/50 flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]/80 z-20 shadow-sm relative`}>
                <div className="pb-3 border-b border-slate-200 dark:border-zinc-800/50 shrink-0 p-4">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-0.5">Checkout</h3>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Summary & Dispatch</h2>
                </div>
                
                {isCheckoutSuccess ? (
                  <div className="flex flex-col flex-1 pt-8 overflow-hidden items-center text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shrink-0 shadow-sm">
                      <Package size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">Order Dispatched!</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-4 font-medium">Receipt <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{lastReceiptNumber}</span> has been processed successfully.</p>
                    
                    <div className="w-full flex flex-col gap-3 mt-auto shrink-0 border-t border-slate-200 dark:border-zinc-800/50 pt-4 p-4">
                      <button 
                        onClick={() => window.print()}
                        className="w-full h-10 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm font-bold text-[14px] hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-[#0a0a0c] hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer size={16} /> Print Receipt
                      </button>
                      <button 
                        onClick={handleStartNewOrder}
                        className="w-full h-10 bg-slate-900 text-slate-50 rounded-sm font-semibold text-[14px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ShoppingBag size={16} /> Start New Order
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 p-4 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col gap-1.5 mb-4 shrink-0">
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 break-words max-w-[120px] text-right">Rs {subTotal.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-zinc-800/50 my-1.5"></div>
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm">TOTAL</span>
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight break-words text-right">Rs {total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 flex flex-col gap-2.5 mb-4 shrink-0 shadow-sm">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                          <User size={10} className="text-slate-400" /> Client / Business Name
                        </label>
                        <input 
                          type="text" 
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-slate-400 transition-all text-xs"
                          placeholder="e.g. Metro Wholesale"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                          <FileText size={10} className="text-slate-400" /> Payment Terms
                        </label>
                        <div className="relative">
                          {!isCustomPayment ? (
                            <>
                              <select
                                value={paymentTerms}
                                onChange={(e) => {
                                  if (e.target.value === 'CUSTOM') {
                                    setIsCustomPayment(true);
                                    setPaymentTerms('');
                                  } else {
                                    setPaymentTerms(e.target.value);
                                  }
                                }}
                                className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 pr-8 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs appearance-none cursor-pointer"
                              >
                                <option value="Cash">Cash (Immediate)</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="30-Day Credit">30-Day Credit</option>
                                <option value="60-Day Credit">60-Day Credit</option>
                                <option value="CUSTOM" className="text-slate-400 italic">Custom Payment Method...</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </>
                          ) : (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Type custom method..."
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(e.target.value)}
                                className="flex-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomPayment(false);
                                  setPaymentTerms('Bank Transfer');
                                }}
                                className="px-2 bg-slate-200 text-slate-600 rounded-sm hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                            Booker Name
                          </label>
                          <input 
                            type="text" 
                            value={bookerName}
                            onChange={(e) => setBookerName(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                            placeholder="Booker Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                            Area Name
                          </label>
                          <input 
                            type="text" 
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-slate-400 transition-all text-xs"
                            placeholder="e.g. Samnabad"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                          Contact
                        </label>
                        <input 
                          type="text" 
                          value={contactNumber}
                          onChange={e => setContactNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-slate-400 transition-all text-xs"
                          placeholder="Phone"
                        />
                      </div>
                    </div>

                    <div className="mt-auto shrink-0 border-t border-slate-200 dark:border-zinc-800/50 pt-3">
                      <button 
                        onClick={handlePrintReceipt}
                        disabled={cart.length === 0}
                        className="w-full h-10 bg-slate-900 text-slate-50 rounded-sm font-semibold text-[14px] hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Printer size={16} /> Preview & Dispatch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {isCameraOpen && (
              <CameraScanner 
                onScan={handleScan}
                onClose={() => setIsCameraOpen(false)}
              />
            )}
          </div>
        );
    }
  };

  if (isAuthChecking) {
    return <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center font-sans text-slate-500">Checking terminal security...</div>;
  }

  if (!isAuthenticated) {
    return <AuthView onLogin={(name) => {
      if (name) setBookerName(name);
    }} />;
  }

  return (
    <>
    <div className="print:hidden fixed inset-0 w-full flex flex-col md:flex-row overflow-hidden bg-[var(--color-void)] font-sans text-slate-900 dark:text-slate-50">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-900 p-3 flex justify-center items-center shrink-0 z-30 shadow-sm relative">
         <div className="font-bold tracking-wider text-sm truncate cursor-pointer" onClick={() => setActiveMenu('Register')}>
            <span className="truncate">SHAHEEN POS <span className="text-blue-600 dark:text-blue-400">ADMIN</span></span>
         </div>
      </div>

      {/* Mobile Main Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="w-full bg-white dark:bg-[#0a0a0c] h-auto max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-t-2xl relative flex flex-col z-50 border-t border-slate-200 dark:border-zinc-900 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-900 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0c]/80 sticky top-0 z-10 backdrop-blur-md rounded-t-2xl">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveMenu('Register'); setIsMobileMenuOpen(false); }}>
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src="/logo_transparent.png" alt="S" className="w-full h-full object-contain drop-shadow-sm" />
                </div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Shaheen <span className="text-blue-600 dark:text-blue-400">POS</span></span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-8">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-2">Main Menu</div>
              {sidebarItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeMenu === item.name
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
                >
                  <div className="relative flex">
                    {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                    {item.hasAlert && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-zinc-900 shadow-sm animate-pulse"></div>}
                  </div>
                  <span className="text-[15px] whitespace-nowrap">{item.name}</span>
                </button>
              ))}
              
              <div className="mt-4 border-t border-slate-200 dark:border-zinc-900 pt-4">
                <button 
                  onClick={() => { setIsAlertDrawerOpen(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  <div className="flex items-center gap-3 relative">
                    <Bell size={20} />
                    <span className="text-[15px]">Incoming Orders</span>
                    {incomingOrders.length > 0 && (
                      <span className="absolute -top-1 -left-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                  {incomingOrders.length > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{incomingOrders.length}</span>
                  )}
                </button>

                <button 
                  onClick={() => { setActiveMenu('Settings'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full mt-2 ${
                    activeMenu === 'Settings'
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                  }`}
                >
                  <Settings size={20} />
                  <span className="text-[15px]">Settings</span>
                </button>
              </div>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="p-4 border-t border-slate-200 dark:border-zinc-900 flex flex-col gap-3 pb-8 shrink-0 bg-slate-50 dark:bg-[#0a0a0c]/50">
              <button 
                onClick={handleSyncToCloud}
                disabled={isSyncing}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all shadow-sm ${isSyncing ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <CloudUpload size={18} className={isSyncing ? "animate-pulse" : ""} />
                <span className="text-sm uppercase tracking-wider">{isSyncing ? 'Syncing...' : 'Sync All'}</span>
              </button>
              <button 
                onClick={() => {
                  supabase.auth.signOut();
                  setIsAuthenticated(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all w-full text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold"
              >
                <LogOut size={16} />
                <span className="text-[12px] uppercase tracking-wider">Log Out</span>
              </button>
              <div className="mt-2 text-center">
                <p className="text-[10px] font-medium text-slate-400 tracking-wider">Powered by Areeb Iqbal</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Sidebar Navigation (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-slate-50 dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex-col shrink-0 z-30 px-3 py-4 print:hidden overflow-y-auto custom-scrollbar shadow-xl shadow-black/5">
        <div className="flex items-center gap-2.5 px-1.5 pb-4 mb-1.5 border-b border-slate-200 dark:border-zinc-800/50 cursor-pointer" onClick={() => setActiveMenu('Register')}>
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/logo_transparent.png" alt="S" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 transition-colors">Shaheen Traders</span>
        </div>

        <nav className="flex-1 flex flex-col gap-[1px]">
          {sidebarItems.map(item => (
            <button
              key={item.name}
              onClick={() => {
                setActiveMenu(item.name);
              }}
              className={`flex items-center gap-[10px] px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px] font-medium w-full text-left relative overflow-hidden ${
                activeMenu === item.name
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-50'
              }`}
            >
              <div className={`relative flex shrink-0 ${activeMenu === item.name ? 'opacity-100' : 'opacity-60'}`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 15 })}
                {item.hasAlert && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-900 shadow-sm animate-pulse"></div>}
              </div>
              <span className="whitespace-nowrap">{item.name}</span>
            </button>
          ))}

          {/* Orders / Notification Bell */}
          <button 
            onClick={() => setActiveMenu('Orders')}
            className={`flex items-center justify-between gap-[9px] px-[9px] py-2 rounded-md transition-all text-[13px] font-medium w-full text-left relative overflow-hidden mt-1 ${
              activeMenu === 'Orders'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 pl-[7px]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50'
            }`}
          >
            <div className="flex items-center gap-[9px] relative">
              <Bell size={15} className={`shrink-0 ${activeMenu === 'Orders' ? 'opacity-100' : 'opacity-60'}`} />
              <span className="whitespace-nowrap">Orders</span>
              {incomingOrders.length > 0 && (
                <span className="absolute -top-1 -left-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
              )}
            </div>
            {incomingOrders.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{incomingOrders.length}</span>
            )}
          </button>

        </nav>

        {/* Action Buttons Container */}
        <div className="mt-auto pt-2 border-t border-slate-200 dark:border-zinc-800/50 flex flex-col gap-2 p-2">
          
          <button 
            onClick={() => setActiveMenu('Settings')}
            className={`flex items-center gap-[9px] px-[9px] py-2 rounded-md transition-all text-[13px] font-medium w-full text-left relative overflow-hidden ${
                activeMenu === 'Settings'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 pl-[7px]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-50'
            }`}
          >
            <Settings size={15} className={`shrink-0 ${activeMenu === 'Settings' ? 'opacity-100' : 'opacity-60'}`} />
            <span className="whitespace-nowrap">Settings</span>
          </button>

          <button 
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-[12.5px] font-bold w-full relative overflow-hidden shadow-sm ${isSyncing ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'}`}
          >
            <CloudUpload size={16} className={`shrink-0 ${isSyncing ? "animate-pulse" : ""}`} />
            <span className="whitespace-nowrap uppercase tracking-wider">{isSyncing ? 'Syncing...' : 'Sync All'}</span>
          </button>

          <button 
            onClick={() => {
              supabase.auth.signOut();
              setIsAuthenticated(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-[12.5px] font-bold w-full relative overflow-hidden text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="whitespace-nowrap uppercase tracking-wider">Sign out</span>
          </button>
          
          <p className="text-[9.5px] text-slate-500 dark:text-slate-500 text-center pt-2.5 tracking-wider">Powered by Areeb Iqbal</p>
        </div>
      </aside>

      {/* Alert Drawer Overlay */}
      {isAlertDrawerOpen && (
        <div className="absolute inset-0 z-50 flex print:hidden">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsAlertDrawerOpen(false)}></div>
           <div className="w-[400px] h-full bg-white dark:bg-zinc-900/60 backdrop-blur-md shadow-2xl relative z-10 flex flex-col border-r border-slate-200 dark:border-zinc-800/50 animate-in slide-in-from-left duration-300">
             <div className="px-6 py-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0c]/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg"><Package size={20} /></div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">Incoming B2B Orders</h2>
                </div>
                <button onClick={() => setIsAlertDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {incomingOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Package size={48} className="mb-4 opacity-20" />
                    <p className="text-[15px] font-medium text-center">No new incoming orders right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {incomingOrders.map((order, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.98]">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110 pointer-events-none"></div>
                         <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">{order.client_name || 'B2B Client'}</span>
                            <div className="flex gap-2">
                              {autoBackedUpOrders.includes((order.id || order.receipt_number)?.toString()) && (
                                <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                  PC BACKED UP
                                </span>
                              )}
                              <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                                NEW
                              </span>
                            </div>
                         </div>
                         <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                            <span className="flex items-center gap-1"><MapPin size={12} /> Area: {order.area || 'N/A'}</span>
                            <span className="flex items-center gap-1"><User size={12} /> Booker: {order.booker_name || 'N/A'}</span>
                            <span className="flex items-center gap-1"><CreditCard size={12} /> Terms: {order.payment_terms || 'Cash'}</span>
                             <span className="flex items-center gap-1"><Phone size={12} /> Phone: {order.client_phone || order.contact_number || order.contactNumber || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-zinc-800/50 pt-3 relative z-10">
                            <span className="text-slate-800 dark:text-slate-200 font-bold text-lg">Rs {(order.total || 0).toLocaleString()}</span>
                            <div className="flex gap-2">
                              {order.status === 'PENDING' ? (
                                <button 
                                  onClick={() => handleAcknowledgeOrder(order)}
                                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                                >
                                  Order Received
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => setViewOrderDetails(order)}
                                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    View
                                  </button>
                                  <button 
                                    onClick={() => handleAcceptOrder(order)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    Auto Make
                                  </button>
                                  <button 
                                    onClick={() => handleCancelIncomingOrder(order)}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs rounded-md shadow-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0c] relative z-10 md:pt-0 pt-[53px]">
        {renderContent()}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden bg-white dark:bg-zinc-900/60 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/50 flex justify-around items-center p-2 pb-safe shrink-0 z-40">
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('catalog'); }}
            className={`flex flex-col items-center p-2 transition-colors ${activeMenu === 'Register' && mobileActiveTab === 'catalog' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
          >
            <Grid size={20} />
            <span className="text-[10px] font-bold mt-1">Catalog</span>
          </button>
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('cart'); }}
            className={`flex flex-col items-center p-2 relative transition-colors ${activeMenu === 'Register' && mobileActiveTab === 'cart' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
          >
            <div className="relative">
               <ShoppingCart size={20} />
               {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>}
            </div>
            <span className="text-[10px] font-bold mt-1">Cart</span>
          </button>
          <button 
            onClick={() => { setActiveMenu('Register'); setMobileActiveTab('checkout'); }}
            className={`flex flex-col items-center p-2 transition-colors ${activeMenu === 'Register' && mobileActiveTab === 'checkout' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
          >
            <CreditCard size={20} />
            <span className="text-[10px] font-bold mt-1">Checkout</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="flex flex-col items-center p-2 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
          >
            <Menu size={20} />
            <span className="text-[10px] font-bold mt-1">Menu</span>
          </button>
        </div>

        {/* Order Preview Modal */}
        <OrderPreviewModal 
          isOpen={isReceiptOpen}
          onClose={handleCloseReceipt}
          onDispatch={handleDispatch}
          onBackupSuccess={() => {
             setIncomingOrders(prev => prev.filter(o => o.id !== activeSupabaseId && o.receipt_number !== draftOrderId));
             setPermanentlyHiddenOrders(prev => [...prev, activeSupabaseId || draftOrderId]);
             
             setIsReceiptOpen(false);
             
             setCart([]);
             setClientName('');
             setArea('');
             setBookerName((() => { const n = localStorage.getItem('shaheen_bookerName'); return (n && n.includes('@')) ? 'Admin' : (n || ''); })());
             setContactNumber('');
             setPaymentTerms('CASH');
             setIsCheckoutSuccess(false);
          }}
          cart={cart}
          total={total}
          subTotal={subTotal}
          clientName={clientName}
          paymentTerms={paymentTerms as string}
          area={area}
          bookerName={bookerName}
          contactNumber={contactNumber}
          draftOrderId={draftOrderId}
          isSubmitting={isSubmitting}
          isDispatched={isCheckoutSuccess}
        />

        {/* View Order Modal */}
        <SimpleOrderViewModal 
          isOpen={!!viewOrderDetails}
          onClose={() => setViewOrderDetails(null)}
          order={viewOrderDetails}
        />

        {/* Receipt Order Modal */}
        {receiptOrderDetails && (
          <OrderPreviewModal
            isOpen={true}
            isDispatched={true}
            onClose={() => setReceiptOrderDetails(null)}
            cart={receiptOrderDetails.items || []}
            total={receiptOrderDetails.total || receiptOrderDetails.total_amount || 0}
            clientName={receiptOrderDetails.client_name || receiptOrderDetails.clientName || receiptOrderDetails.shop_name || 'Walk-in'}
            paymentTerms={receiptOrderDetails.payment_terms || 'CASH'}
            draftOrderId={receiptOrderDetails.receipt_number || receiptOrderDetails.id}
            area={receiptOrderDetails.area || 'N/A'}
            bookerName={receiptOrderDetails.booker_name || receiptOrderDetails.bookerName || 'Self'}
            contactNumber={receiptOrderDetails.client_phone || receiptOrderDetails.contact_number || receiptOrderDetails.contactNumber || 'N/A'}
            subTotal={receiptOrderDetails.subTotal || receiptOrderDetails.total || receiptOrderDetails.total_amount || 0}
          />
        )}
      </div>
    </>
  );
}