import React, { useEffect, useState } from 'react';
import B2BLoginView from '../views/B2BLoginView';
import { supabase } from '../lib/supabase';

export default function B2BAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check local storage for active booker session
      const activeBooker = localStorage.getItem('shaheen_active_booker');
      
      if (activeBooker) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // If loading takes too long, show a retry option
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadingTooLong(true), 6000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50 dark:bg-slate-900 flex-col gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-50 animate-spin"></div>
        {loadingTooLong && (
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 active:scale-95 transition-transform"
          >
            Tap to retry
          </button>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <B2BLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}
