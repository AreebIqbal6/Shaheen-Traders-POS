import React, { useEffect, useState } from 'react';
import B2BLoginView from '../views/B2BLoginView';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { purgeBookerSession, setupCrossTabSecurityListener } from '../utils/authSecurity';

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

              let isInvalid = !result.data || 
                result.error || 
                result.data.username !== activeBooker.username || 
                result.data.auth_token !== activeBooker.auth_token;

              // Check if admin credentials were updated after booker's login
              if (!isInvalid) {
                try {
                  const creds = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'admin_credentials_updated_at')
                    .maybeSingle();
                  const bookerLoginTime = Number(localStorage.getItem('shaheen_booker_login_time') || '0');
                  if (creds.data?.value && bookerLoginTime > 0) {
                    const updatedAt = new Date(creds.data.value).getTime();
                    if (updatedAt > bookerLoginTime) {
                      isInvalid = true;
                    }
                  }
                } catch {}
              }

              if (isInvalid) {
                purgeBookerSession('Your username or password was changed. Please log in again.', activeBooker.id);
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
          purgeBookerSession();
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

      const triggerEviction = (msg: string) => {
        purgeBookerSession(msg, activeBooker.id);
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
                triggerEviction('Your access has been revoked by the administrator.');
              }
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              if (payload.new.id === activeBooker.id || payload.new.booker_number === activeBooker.booker_number) {
                const hasAuthTokenChanged = payload.new.auth_token !== activeBooker.auth_token;
                const hasUsernameChanged = payload.new.username !== activeBooker.username;

                if (hasAuthTokenChanged || hasUsernameChanged) {
                  triggerEviction('Your username or password was changed. Logged out everywhere immediately.');
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
            if (payload.new?.key === 'admin_credentials_updated_at' || payload.new?.key === 'system_auth_revoked_at') {
              triggerEviction('System credentials changed by administrator. Logged out everywhere.');
            } else if (payload.new?.key === 'booker_credentials_revoked_at') {
              try {
                const info = typeof payload.new.value === 'string' ? JSON.parse(payload.new.value) : payload.new.value;
                if (info?.bookerId === 'ALL' || info?.bookerId === activeBooker.id || info?.bookerId === activeBooker.booker_number) {
                  triggerEviction('Your username or password was changed. Logged out everywhere immediately.');
                }
              } catch {}
            }
          }
        )
        .subscribe();

      // 2. Cross-tab immediate sync (0ms)
      const unsubscribeCrossTab = setupCrossTabSecurityListener(
        () => {},
        (reason, targetBookerId) => {
          if (!targetBookerId || targetBookerId === activeBooker.id || targetBookerId === activeBooker.booker_number) {
            triggerEviction(reason || 'Session terminated from another tab.');
          }
        }
      );

      const handleCustomLogout = (e: any) => {
        const target = e.detail?.targetBookerId;
        if (!target || target === activeBooker.id || target === activeBooker.booker_number) {
          setIsAuthenticated(false);
        }
      };
      window.addEventListener('shaheen_booker_logged_out', handleCustomLogout);

      // 3. Periodic heartbeat & visibility re-check for active devices
      const checkFreshness = async () => {
        if (!navigator.onLine) return;
        try {
          // Check booker credentials in DB
          const { data } = await supabase
            .from('bookers')
            .select('id, username, auth_token')
            .eq('id', activeBooker.id)
            .maybeSingle();

          if (!data || data.username !== activeBooker.username || data.auth_token !== activeBooker.auth_token) {
            triggerEviction('Your session has expired due to credential changes.');
            return;
          }

          // Also check admin/system revocation timestamp
          const creds = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['admin_credentials_updated_at', 'system_auth_revoked_at', 'booker_credentials_revoked_at']);

          if (creds.data && creds.data.length > 0) {
            const loginTime = Number(localStorage.getItem('shaheen_booker_login_time') || '0');
            for (const row of creds.data) {
              if (!row.value) continue;
              if (row.key === 'admin_credentials_updated_at' || row.key === 'system_auth_revoked_at') {
                const updatedAt = new Date(row.value).getTime();
                if (loginTime > 0 && updatedAt > loginTime) {
                  triggerEviction('System credentials changed by administrator. Logged out everywhere.');
                  return;
                }
              } else if (row.key === 'booker_credentials_revoked_at') {
                try {
                  const info = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
                  const revTime = new Date(info?.timestamp || 0).getTime();
                  if (loginTime > 0 && revTime > loginTime) {
                    if (info?.bookerId === 'ALL' || info?.bookerId === activeBooker.id || info?.bookerId === activeBooker.booker_number) {
                      triggerEviction('Your username or password was changed. Logged out everywhere immediately.');
                      return;
                    }
                  }
                } catch {}
              }
            }
          }
        } catch {}
      };

      const heartbeatTimer = setInterval(checkFreshness, 5000);
      const handleWake = () => {
        if (document.visibilityState === 'visible') checkFreshness();
      };
      document.addEventListener('visibilitychange', handleWake);
      window.addEventListener('focus', checkFreshness);
        
      return () => {
        supabase.removeChannel(channel);
        unsubscribeCrossTab();
        window.removeEventListener('shaheen_booker_logged_out', handleCustomLogout);
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
