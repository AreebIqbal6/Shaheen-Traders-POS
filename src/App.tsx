import React from 'react';
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
  return (
    <>
      <Toaster 
        position="top-center" 
        containerClassName="print:hidden"
        toastOptions={{
          style: {
            fontSize: '16px',
            padding: '16px',
            maxWidth: '500px'
          }
        }}
      />
      <OfflineIndicator />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/admin/*" element={<AdminPOSView />} />
        <Route path="/booker" element={<B2BAuthWrapper><B2BShopView /></B2BAuthWrapper>} />
        <Route path="/receipt/:orderId" element={<B2BAuthWrapper><ReceiptView /></B2BAuthWrapper>} />
      </Routes>
    </>
  );
}
