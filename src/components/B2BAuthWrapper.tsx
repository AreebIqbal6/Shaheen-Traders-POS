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
              // Verify if booker still exists AND username/password hasn't changed
              const result = await Promise.race([
                supabase
                  .from('bookers')
                  .select('id, username, auth_token')
                  .eq('id', activeBooker.id)
                  .maybeSingle(),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
              ]);

              const isInvalid = !result.data || 
                result.error || 
                result.data.username !== activeBooker.username || 
                result.data.auth_token !== activeBooker.auth_token;

              if (isInvalid) {
                localStorage.removeItem('shaheen_active_booker');
                localStorage.removeItem('shaheen_bookerName');
                const profiles = JSON.parse(localStorage.getItem('booker_profiles') || '[]');
                const filtered = profiles.filter((b: any) => b.id !== activeBooker.id);
                localStorage.setItem('booker_profiles', JSON.stringify(filtered));
                // Invalidate cached credentials in offline list as well
                const cachedBookers = JSON.parse(localStorage.getItem('shaheen_bookers') || '[]');
                const updatedList = cachedBookers.filter((b: any) => b.id !== activeBooker.id);
                localStorage.setItem('shaheen_bookers', JSON.stringify(updatedList));

                setIsAuthenticated(false);
                setIsLoading(false);
                toast.error('Your username or password was changed. Please log in again.', { duration: 6000 });
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

  // Realtime listener and heartbeat to kick out immediately if removed or credentials changed while app is open
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const activeBookerStr = localStorage.getItem('shaheen_active_booker');
    if (!activeBookerStr) return;
    
    try {
      const activeBooker = JSON.parse(activeBookerStr);
      
      const purgeBookerSession = (msg: string) => {
        localStorage.removeItem('shaheen_active_booker');
        localStorage.removeItem('shaheen_bookerName');
        const profiles = JSON.parse(localStorage.getItem('booker_profiles') || '[]');
        const filtered = profiles.filter((b: any) => b.id !== activeBooker.id);
        localStorage.setItem('booker_profiles', JSON.stringify(filtered));
        const cachedBookers = JSON.parse(localStorage.getItem('shaheen_bookers') || '[]');
        const updatedList = cachedBookers.filter((b: any) => b.id !== activeBooker.id);
        localStorage.setItem('shaheen_bookers', JSON.stringify(updatedList));
        
        setIsAuthenticated(false);
        toast.error(msg, { duration: 6000 });
      };

      // 1. Supabase Realtime channel
      const channel = supabase
        .channel(`bookers-security-${activeBooker.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookers' },
          (payload: any) => {
            if (payload.eventType === 'DELETE') {
              if (payload.old?.id === activeBooker.id || payload.old?.booker_number === activeBooker.booker_number) {
                purgeBookerSession('Your access has been revoked by the admin.');
              }
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              if (payload.new.id === activeBooker.id || payload.new.booker_number === activeBooker.booker_number) {
                const hasAuthTokenChanged = payload.new.auth_token !== activeBooker.auth_token;
                const hasUsernameChanged = payload.new.username !== activeBooker.username;

                if (hasAuthTokenChanged || hasUsernameChanged) {
                  purgeBookerSession('Your username or password was changed. Logged out everywhere immediately.');
                } else {
                  localStorage.setItem('shaheen_active_booker', JSON.stringify({ ...activeBooker, ...payload.new }));
                }
              }
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          (payload: any) => {
            if (payload.new?.key === 'admin_credentials_updated_at') {
              purgeBookerSession('System credentials changed by administrator. Logged out everywhere.');
            }
          }
        )
        .subscribe();

      // 2. Periodic heartbeat & visibility re-check for active devices
      const checkFreshness = async () => {
        if (!navigator.onLine) return;
        try {
          const { data } = await supabase
            .from('bookers')
            .select('id, username, auth_token')
            .eq('id', activeBooker.id)
            .maybeSingle();

          if (!data || data.username !== activeBooker.username || data.auth_token !== activeBooker.auth_token) {
            purgeBookerSession('Your session has expired due to credential changes.');
          }
        } catch {}
      };

      const heartbeatTimer = setInterval(checkFreshness, 15000);
      const handleWake = () => {
        if (document.visibilityState === 'visible') checkFreshness();
      };
      document.addEventListener('visibilitychange', handleWake);
      window.addEventListener('focus', checkFreshness);
        
      return () => {
        supabase.removeChannel(channel);
        clearInterval(heartbeatTimer);
        document.removeEventListener('visibilitychange', handleWake);
        window.removeEventListener('focus', checkFreshness);
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
