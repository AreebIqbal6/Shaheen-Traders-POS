import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminPOSView from './views/AdminPOSView';
import B2BShopView from './views/B2BShopView';
import B2BAuthWrapper from './components/B2BAuthWrapper';
import ReceiptView from './views/ReceiptView';
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
      const isDesktop = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
      if (!isDesktop) {
        setTarget(`/booker${location.search}${location.hash}`);
        return;
      }
      try {
        const { getName } = await import('@tauri-apps/api/app');
        const appName = await getName();
        if (appName.toLowerCase().includes('booker')) {
          setTarget(`/booker${location.search}${location.hash}`);
        } else {
          setTarget(`/admin${location.search}${location.hash}`);
        }
      } catch (err) {
        setTarget(`/admin${location.search}${location.hash}`);
      }
    }
    
    if (location.pathname === '/') {
      determineRoute();
    }
  }, [location]);

  if (location.pathname === '/') {
    if (target) {
      return <Navigate to={target} replace />;
    }
    return null; // or loading
  }
  return null;
};

async function checkForUpdates() {
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const { ask } = await import('@tauri-apps/plugin-dialog');
    const { relaunch } = await import('@tauri-apps/plugin-process');
    
    const update = await check();
    if (update) {
      const yes = await ask(`Update to ${update.version} is available!\n\nRelease notes: ${update.body || 'Bug fixes and improvements.'}\n\nDo you want to install it now?`, { 
        title: 'Update Available', 
        kind: 'info',
        okLabel: 'Update',
        cancelLabel: 'Cancel'
      });
      if (yes) {
        let downloaded = 0;
        let contentLength = 0;
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              break;
            case 'Progress':
              downloaded += event.data.chunkLength;
              break;
            case 'Finished':
              break;
          }
        });
        await relaunch();
      }
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

export default function App() {
  const [remountKey, setRemountKey] = React.useState(0);
  
  React.useEffect(() => {
    // Check for OTA updates on startup and every hour
    checkForUpdates();
    const updateInterval = setInterval(checkForUpdates, 1000 * 60 * 60); // 1 hour

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
      
      // Update HTML Title
      document.title = storeName;
      
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
      clearInterval(updateInterval);
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
            const details = {
              clientName: order.client_name,
              area: order.area,
              contactNumber: order.contact_number || order.client_phone,
              bookerName: order.booker_name,
              total: order.total || order.total_amount
            };

            if (isTauri) {
              const success = await saveOrderBackup(orderId, order.items || [], details);
              if (success) {
                autoBackedUp.push(orderId);
                localStorage.setItem('shaheen_auto_backed_up', JSON.stringify(autoBackedUp));
                console.log(`[Startup Sync] Backed up missed order: ${orderId}`);
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

    // Run startup backup
    backupMissedOrders();

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
                  total: order.total || order.total_amount
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
      supabase.removeChannel(syncChannel);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, []);

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
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin/*" element={<AdminPOSView key={`admin-${remountKey}`} />} />
        <Route path="/booker" element={<B2BAuthWrapper><B2BShopView /></B2BAuthWrapper>} />
        <Route path="/receipt/:orderId" element={<B2BAuthWrapper><ReceiptView /></B2BAuthWrapper>} />
      </Routes>
    </>
  );
}
