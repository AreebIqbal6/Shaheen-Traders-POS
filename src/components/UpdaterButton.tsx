import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpdaterButton() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Only run on desktop Tauri
  const isDesktop = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;

  const performCheck = async (silent = true) => {
    if (!isDesktop) return;
    try {
      if (!silent) setIsChecking(true);
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      
      if (update) {
        setUpdateAvailable(update);
        if (!silent) toast.success(`Update ${update.version} is available!`);
      } else {
        if (!silent) toast('You are on the latest version.', { icon: '✨' });
      }
    } catch (err) {
      console.error('Update check failed', err);
      if (!silent) toast.error('Failed to check for updates.');
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isDesktop) return;
    
    // Initial check
    performCheck(true);

    // Check every 24 hours
    const interval = setInterval(() => {
      performCheck(true);
    }, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateClick = async () => {
    if (!isDesktop) return;
    
    // If no update available, checking manually
    if (!updateAvailable) {
      performCheck(false);
      return;
    }

    // If update IS available, prompt to install
    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      const { relaunch } = await import('@tauri-apps/plugin-process');

      const yes = await ask(`Update to ${updateAvailable.version} is available!\n\nRelease notes: ${updateAvailable.body || 'Bug fixes and improvements.'}\n\nDo you want to install it now?`, { 
        title: 'Update Available', 
        kind: 'info',
        okLabel: 'Install Update',
        cancelLabel: 'Cancel'
      });

      if (yes) {
        setIsDownloading(true);
        const toastId = toast.loading('Downloading update...');
        await updateAvailable.downloadAndInstall((event: any) => {
          // Could track progress here if needed
        });
        toast.success('Update installed! Relaunching...', { id: toastId });
        await relaunch();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to install update.');
      setIsDownloading(false);
    }
  };

  if (!isDesktop) return null;

  return (
    <button
      onClick={handleUpdateClick}
      disabled={isDownloading || isChecking}
      className={`absolute top-3 right-5 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm border ${
        updateAvailable 
          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/30' 
          : 'bg-slate-50 dark:bg-zinc-800/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
      }`}
      title={updateAvailable ? `Update ${updateAvailable.version} available!` : 'Check for updates'}
    >
      {updateAvailable ? (
        <>
          <DownloadCloud size={14} className={isDownloading ? 'animate-bounce' : 'animate-pulse'} />
          <span>{isDownloading ? 'Updating...' : 'Update Available'}</span>
        </>
      ) : (
        <>
          <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} />
          <span>{isChecking ? 'Checking...' : 'Up to date'}</span>
        </>
      )}
    </button>
  );
}
