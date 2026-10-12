import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { 
  CURRENT_APP_VERSION, 
  fetchRemoteVersionInfo, 
  isVersionOutdated, 
  broadcastLatestVersionToCloud 
} from '../utils/versionEnforcer';
import { supabase } from '../lib/supabase';

export default function VersionGate() {
  const [isOutdated, setIsOutdated] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState<string>(() => {
    return localStorage.getItem('shaheen_min_required_version') || CURRENT_APP_VERSION;
  });
  const [isReloading, setIsReloading] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const info = await fetchRemoteVersionInfo();
      setRequiredVersion(info.minRequiredVersion);
      
      const outdated = isVersionOutdated(CURRENT_APP_VERSION, info.minRequiredVersion);
      setIsOutdated(outdated);

      // If this client is on the latest version and is an Admin or desktop instance,
      // broadcast its version to ensure cloud settings table is always up to date
      if (!outdated && (location.pathname.startsWith('/admin') || '__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
        broadcastLatestVersionToCloud(CURRENT_APP_VERSION).catch(() => {});
      }
    } catch (err) {
      console.warn('[VersionGate] Error checking remote version:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Initial check
    checkVersion();

    // 2. Realtime listener on Supabase settings table (0ms instant version enforcement)
    const versionChannel = supabase
      .channel('version-gate-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload: any) => {
          const key = payload?.new?.key;
          if (key === 'min_required_version' || key === 'app_latest_version') {
            const val = payload.new.value;
            if (val) {
              setRequiredVersion(val);
              setIsOutdated(isVersionOutdated(CURRENT_APP_VERSION, val));
            }
          }
        }
      )
      .subscribe();

    // 3. Re-check on mobile wake or window focus
    const handleWake = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);

    // 4. Background heartbeat check every 60 seconds
    const interval = setInterval(checkVersion, 60000);

    return () => {
      supabase.removeChannel(versionChannel);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      clearInterval(interval);
    };
  }, [checkVersion]);

  const handleUpdateAndReload = async () => {
    setIsReloading(true);

    try {
      // 1. Purge all CacheStorage caches (PWA Service Worker caches)
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // 2. Unregister service workers to ensure fresh fetch
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // Clear chunk reload trackers
      sessionStorage.removeItem('shaheen_last_chunk_reload');
      sessionStorage.removeItem('shaheen_chunk_eb_reload');
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }

    // 3. Force hard browser/webview reload with cache-busting timestamp query parameter
    const targetUrl = window.location.origin + window.location.pathname + '?v=' + Date.now() + window.location.hash;
    window.location.href = targetUrl;
  };

  if (!isOutdated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-2xl p-6 flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 mt-2 shadow-inner">
          <ShieldAlert size={36} strokeWidth={2.2} />
        </div>

        <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
          System Update Required
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          This version of <strong>Shaheen Traders POS</strong> is out of date and can no longer be used. All Booker and Admin devices must run the latest version to maintain data synchronization.
        </p>

        {/* Version Compare Badges */}
        <div className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 my-5 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Your Version</span>
            <span className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">v{CURRENT_APP_VERSION}</span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 dark:border-zinc-800" />

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Required Version</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">v{requiredVersion}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpdateAndReload}
          disabled={isReloading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={isReloading ? 'animate-spin' : ''} />
          <span>{isReloading ? 'Reloading Latest Version...' : 'Update Now & Reload'}</span>
        </button>

        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 font-medium">
          Clicking will clear cached data and load version {requiredVersion} immediately.
        </p>
      </div>
    </div>
  );
}
