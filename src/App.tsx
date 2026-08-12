import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
const AdminPOSView = React.lazy(() => import('./views/AdminPOSView'));
const B2BShopView = React.lazy(() => import('./views/B2BShopView'));
const RoleSelectionView = React.lazy(() => import('./views/RoleSelectionView'));
const B2BAuthWrapper = React.lazy(() => import('./components/B2BAuthWrapper'));
const ReceiptView = React.lazy(() => import('./views/ReceiptView'));
const ReportView = React.lazy(() => import('./views/ReportView'));
const ReportAuthWrapper = React.lazy(() => import('./components/ReportAuthWrapper'));
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { saveOrderBackup } from './utils/exportManager';


const RootRedirect = () => {
  const [target, setTarget] = React.useState<string | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    async function determineRoute() {
      if (location.pathname !== '/') {
        setTarget(location.pathname + location.search + location.hash);
        return;
      }
      
      const isDesktop = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
      if (!isDesktop) {
        // Mobile browsers always default to Booker (or whatever you prefer)
        setTarget(`/booker${location.search}${location.hash}`);
        return;
      }
      
      // If desktop, first check if a command-line argument was passed
      try {
        const { getMatches } = await import('@tauri-apps/plugin-cli');
        const matches = await getMatches();
        if (matches.args.mode && matches.args.mode.value) {
           const cliMode = matches.args.mode.value as string;
           if (cliMode === 'admin') {
             localStorage.setItem('shaheen_app_mode', 'admin');
             setTarget(`/admin${location.search}${location.hash}`);
             return;
           } else if (cliMode === 'booker') {
             localStorage.setItem('shaheen_app_mode', 'booker');
             setTarget(`/booker${location.search}${location.hash}`);
             return;
           }
        }
      } catch (e) {
        console.warn("CLI plugin not available or failed to read args");
      }

      // Web PWA check: look for ?mode= in URL
      const queryParams = new URLSearchParams(location.search);
      const webMode = queryParams.get('mode');
      if (webMode === 'admin') {
        localStorage.setItem('shaheen_app_mode', 'admin');
        setTarget(`/admin${location.hash}`);
        return;
      } else if (webMode === 'booker') {
        localStorage.setItem('shaheen_app_mode', 'booker');
        setTarget(`/booker${location.hash}`);
        return;
      }

      // Fallback to configured mode
      const configuredMode = localStorage.getItem('shaheen_app_mode');
      
      if (configuredMode === 'admin') {
        setTarget(`/admin${location.search}${location.hash}`);
      } else if (configuredMode === 'booker') {
        setTarget(`/booker${location.search}${location.hash}`);
      } else {
        // If not configured, show the selection screen
        setTarget(`/select-role`);
      }
    }
    determineRoute();
  }, [location]);

  if (location.pathname === '/') {
    if (target) {
      return <Navigate to={target} replace />;
    }
    return null; // or loading
  }
  return null;
};

import { autoGenerateMissingReports } from './utils/reportGenerator';

export default function App() {
  const [remountKey, setRemountKey] = React.useState(0);
  
  React.useEffect(() => {
    // Generate missing monthly and bi-yearly reports in the background
    // Delay heavy background report generation by 5 seconds to let UI mount smoothly
    const reportTimeout = setTimeout(() => {
      autoGenerateMissingReports().catch(err => console.error("Auto report generation failed:", err));
    }, 5000);

    const handler = () => setRemountKey(k => k + 1);
    window.addEventListener('force_remount', handler);
    
    // Branding Sync
    const syncBranding = async () => {
      let storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Traders';
      let logo = localStorage.getItem('shaheen_store_logo') || '/logo_transparent.png';
      
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data) {
          const cloudName = data.find(d => d.key === 'shaheen_store_name')?.value;
          const cloudLogo = data.find(d => d.key === 'shaheen_logo')?.value;
          if (cloudName) { storeName = cloudName; localStorage.setItem('shaheen_store_name', cloudName); }
          if (cloudLogo) { logo = cloudLogo; localStorage.setItem('shaheen_store_logo', cloudLogo); localStorage.setItem('shaheen_logo', cloudLogo); }
        }
      } catch(e) {}
      
      // Update HTML Title (handled dynamically by route now, this just sets default)
      if (document.title === 'Shaheen Traders' || document.title === '') {
        document.title = storeName;
      }
      
      // Update Favicon
      const icon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="apple-touch-icon"]');
      if (icon) {
        icon.setAttribute('href', logo);
      } else {
        const newIcon = document.createElement('link');
        newIcon.rel = 'icon';
        newIcon.href = logo;
        document.head.appendChild(newIcon);
      }
      
      // Update Tauri Title
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().setTitle(storeName);
      } catch (err) {
        // Not in Tauri, ignore
      }
    };
    
    syncBranding(); // Initial sync
    window.addEventListener('branding_updated', syncBranding);
    
    // Visibility change: re-sync when device wakes from sleep
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncBranding();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Subscribe to settings changes from other devices
    const settingsSub = supabase
      .channel('public:settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        syncBranding();
        window.dispatchEvent(new Event('branding_updated'));
      })
      .subscribe();

    return () => {
      clearTimeout(reportTimeout);
      settingsSub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('force_remount', handler);
      window.removeEventListener('branding_updated', syncBranding);
    };
  }, []);

  // ==========================================
  // PRIORITY 1: THE SYNC BEDROCK (BACKGROUND)
  // ==========================================
  useEffect(() => {
    // 1. Only run this aggressive background listener on the PC environment
    // to prevent mobile bookers from trying to execute local file writes.
    const isDesktop = '__TAURI_INTERNALS__' in window || '__TAURI__' in window || window.location.pathname.startsWith('/admin');
    
    if (!isDesktop) return;

    // STARTUP: Back up ALL completed orders that haven't been backed up yet
    const backupMissedOrders = async () => {
      try {
        const { data: completedOrders, error } = await supabase
          .from('orders')
          .select('*')
          .in('status', ['COMPLETED', 'ACCEPTED'])
          .order('created_at', { ascending: false })
          .limit(200);

        if (error || !completedOrders) return;

        const autoBackedUp = JSON.parse(localStorage.getItem('shaheen_auto_backed_up') || '[]');
        const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
        
        for (const order of completedOrders) {
          const orderId = (order.receipt_number || order.id).toString();
          if (autoBackedUp.includes(orderId)) continue;
          
          try {
            const details = { clientName: order.client_name, area: order.area, contactNumber: order.contact_number || order.client_phone, bookerName: order.booker_name, total: order.total || order.total_amount, createdAt: order.created_at || order.date };

            if (isTauri) {
              const success = await saveOrderBackup(orderId, order.items || [], details);
              if (success) {
                autoBackedUp.push(orderId);
                localStorage.setItem('shaheen_auto_backed_up', JSON.stringify(autoBackedUp));
                console.log(`[Startup Sync] Backed up missed order: ${orderId}`);
                // Yield thread to prevent UI freezing on first massive backup run
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          } catch (err) {
            console.error(`[Startup Sync] Failed to backup order ${orderId}:`, err);
          }
        }
      } catch (err) {
        console.error('[Startup Sync] Failed to fetch completed orders:', err);
      }
    };

      // Run startup backup immediately, and then strictly every 10 seconds.
      // Delay startup backup by 8 seconds to prioritize UI rendering
      let syncInterval: any;
      const startupTimeout = setTimeout(() => {
        backupMissedOrders();
        syncInterval = setInterval(() => {
          backupMissedOrders();
        }, 10000);
      }, 8000);

    // 2. Establish the silent global listener
    const syncChannel = supabase
      .channel('global-silent-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new;
          
          // 3. Catch orders completed from the mobile admin app
          if (order && (order.status === 'COMPLETED' || order.status === 'ACCEPTED')) {
            try {
              const orderId = (order.receipt_number || order.id).toString();
              const autoBackedUp = JSON.parse(localStorage.getItem('shaheen_auto_backed_up') || '[]');
              
              // 4. Ensure idempotency (never backup the same order twice)
              if (!autoBackedUp.includes(orderId)) {
                console.log(`[Bedrock Sync] New completed order detected: ${orderId}. Securing to PC...`);
                
                const details = {
                  clientName: order.client_name,
                  area: order.area,
                  contactNumber: order.contact_number || order.client_phone,
                  bookerName: order.booker_name,
                  total: order.total || order.total_amount,
                  createdAt: order.created_at || order.date
                };

                // 5. Trigger the silent file-system backup without UI prompts
                const isTauri = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
                if (isTauri) {
                  const success = await saveOrderBackup(orderId, order.items || [], details);
                  if (success) {
                    autoBackedUp.push(orderId);
                    localStorage.setItem('shaheen_auto_backed_up', JSON.stringify(autoBackedUp));
                    console.log(`[Bedrock Sync] Order ${orderId} secured on local hardware successfully.`);
                  }
                }
              }
            } catch (err) {
              console.error('[Bedrock Sync] Critical silent sync failure:', err);
            }
          }
        }
      )
      .subscribe();

    // Also re-check missed orders when PC wakes from sleep
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        backupMissedOrders();
      }
    };
    document.addEventListener('visibilitychange', handleWake);

    return () => {
      clearTimeout(startupTimeout);
      if (syncInterval) clearInterval(syncInterval);
      supabase.removeChannel(syncChannel);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, []);

  const location = useLocation();
  useEffect(() => {
    const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Traders';
    if (location.pathname.includes('/admin')) {
      document.title = `Admin Portal | ${storeName}`;
    } else if (location.pathname.includes('/booker')) {
      document.title = `Booker Portal | ${storeName}`;
    } else if (location.pathname.includes('/receipt')) {
      document.title = `Order Receipt | ${storeName}`;
    } else if (location.pathname.includes('/report')) {
      document.title = `Report | ${storeName}`;
    } else {
      document.title = storeName;
    }
  }, [location]);

  return (
    <>
      <Toaster 
        position="top-center" 
        containerClassName="print:hidden"
        toastOptions={{
          className: 'dark:bg-zinc-900 dark:text-slate-50 dark:border dark:border-zinc-800 bg-white text-slate-900 border border-slate-200',
          style: {
            fontSize: '14px',
            padding: '12px 16px',
            maxWidth: '500px',
            borderRadius: '8px',
            background: 'inherit',
            color: 'inherit'
          }
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== 'loading' && (
                  <button 
                    onClick={() => toast.dismiss(t.id)} 
                    className="ml-2 p-1 opacity-50 hover:opacity-100 transition-opacity rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <OfflineIndicator />
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/select-role" element={<RoleSelectionView />} />
          <Route path="/admin/*" element={<AdminPOSView key={`admin-${remountKey}`} />} />
          <Route path="/booker" element={<B2BAuthWrapper><B2BShopView /></B2BAuthWrapper>} />
          <Route path="/receipt/:orderId" element={<ReceiptView />} />
          <Route path="/report/:reportId" element={<ReportAuthWrapper><ReportView /></ReportAuthWrapper>} />
        </Routes>
      </React.Suspense>
    </>
  );
}
