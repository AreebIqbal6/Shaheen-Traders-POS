import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminPOSView from './views/AdminPOSView';
import B2BShopView from './views/B2BShopView';
import B2BAuthWrapper from './components/B2BAuthWrapper';
import ReceiptView from './views/ReceiptView';
import OfflineIndicator from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';

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
