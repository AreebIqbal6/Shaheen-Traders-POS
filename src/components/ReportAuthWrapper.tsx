import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AuthView from '../views/AuthView';

export default function ReportAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthChecking) {
    return <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center font-sans text-slate-500">Checking security clearance...</div>;
  }

  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}
