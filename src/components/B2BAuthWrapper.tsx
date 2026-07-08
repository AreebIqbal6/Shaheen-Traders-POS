import React, { useEffect, useState } from 'react';
import B2BLoginView from '../views/B2BLoginView';
import { supabase } from '../lib/supabase';

export default function B2BAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <div className="flex h-[100dvh] items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-pulse w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-50 dark:bg-slate-900"></div></div>;
  }

  if (!isAuthenticated) {
    return <B2BLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
}
