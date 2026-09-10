import React, { useEffect, useState } from 'react';
import B2BLoginView from '../views/B2BLoginView';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function B2BAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const activeBookerStr = localStorage.getItem('shaheen_active_booker');
      
      if (activeBookerStr) {
        try {
          const activeBooker = JSON.parse(activeBookerStr);
          if (navigator.onLine && activeBooker?.id) {
            try {
              // Verify if booker still exists — with a 5s timeout
              const result = await Promise.race([
                supabase
                  .from('bookers')
                  .select('id')
                  .eq('id', activeBooker.id)
                  .maybeSingle(),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
              ]);

              if (!result.data || result.error) {
                localStorage.removeItem('shaheen_active_booker');
                const profiles = JSON.parse(localStorage.getItem('booker_profiles') || '[]');
                const filtered = profiles.filter((b: any) => b.id !== activeBooker.id);
                localStorage.setItem('booker_profiles', JSON.stringify(filtered));
                setIsAuthenticated(false);
                setIsLoading(false);
                toast.error('Your access has been revoked by the admin.');
                return;
              }
            } catch {
              // Timeout or network error — allow offline access
            }
          }
          setIsAuthenticated(true);
        } catch (e) {
          localStorage.removeItem('shaheen_active_booker');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Realtime listener to kick out if removed while app is open
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const activeBookerStr = localStorage.getItem('shaheen_active_booker');
    if (!activeBookerStr) return;
    
    try {
      const activeBooker = JSON.parse(activeBookerStr);
      const channel = supabase
        .channel('bookers-delete')
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'bookers', filter: `id=eq.${activeBooker.id}` },
          () => {
            localStorage.removeItem('shaheen_active_booker');
            const profiles = JSON.parse(localStorage.getItem('booker_profiles') || '[]');
            const filtered = profiles.filter((b: any) => b.id !== activeBooker.id);
            localStorage.setItem('booker_profiles', JSON.stringify(filtered));
            
            setIsAuthenticated(false);
            toast.error('Your access has been revoked by the admin.', { duration: 6000 });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {}
  }, [isAuthenticated]);

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
