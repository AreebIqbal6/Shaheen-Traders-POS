import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminPOSView from './views/AdminPOSView';
import B2BShopView from './views/B2BShopView';
import B2BAuthWrapper from './components/B2BAuthWrapper';
import ReceiptView from './views/ReceiptView';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { saveOrderBackup } from './utils/exportManager';

const RootRedirect = () => {
  const location = useLocation();
  if (location.pathname === '/') {
    // Basic root redirection, can be smarter based on auth state
    return <Navigate to={`/booker${location.search}${location.hash}`} replace />;
  }
  return null;
};

export default function App() {
  const [remountKey, setRemountKey] = React.useState(0);
  
  React.useEffect(() => {
    const handler = () => setRemountKey(k => k + 1);
    window.addEventListener('force_remount', handler);
    return () => window.removeEventListener('force_remount', handler);
  }, []);

  // ==========================================
  // PRIORITY 1: THE SYNC BEDROCK (BACKGROUND)
  // ==========================================
  useEffect(() => {
    // 1. Only run this aggressive background listener on the PC environment
    // to prevent mobile bookers from trying to execute local file writes.
    const isDesktop = '__TAURI__' in window || window.location.pathname.startsWith('/admin');
    
    if (!isDesktop) return;

    // 2. Establish the silent global listener
    const syncChannel = supabase
      .channel('global-silent-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new;
          
          // 3. Catch orders completed from the mobile admin app
          if (order && order.status === 'COMPLETED') {
            try {
              const orderId = (order.receipt_number || order.id).toString();
              const autoBackedUp = JSON.parse(localStorage.getItem('shaheen_auto_backed_up') || '[]');
              
              // 4. Ensure idempotency (never backup the same order twice)
              if (!autoBackedUp.includes(orderId)) {
                console.log(`[Bedrock Sync] New completed order detected: ${orderId}. Securing to PC...`);
                
                const details = {
                  clientName: order.client_name,
                  area: order.area,
                  contactNumber: order.contact_number,
                  bookerName: order.booker_name,
                  total: order.total
                };

                // 5. Trigger the silent file-system backup without UI prompts
                const success = await saveOrderBackup(orderId, order.items || [], details);
                
                if (success) {
                  autoBackedUp.push(orderId);
                  localStorage.setItem('shaheen_auto_backed_up', JSON.stringify(autoBackedUp));
                  console.log(`[Bedrock Sync] Order ${orderId} secured on local hardware successfully.`);
                }
              }
            } catch (err) {
              console.error('[Bedrock Sync] Critical silent sync failure:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(syncChannel);
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
      />
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