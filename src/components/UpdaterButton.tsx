import React, { useState, useEffect } from 'react';
import { DownloadCloud, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpdaterButton() {
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  // Only run on desktop Tauri
  const isDesktop = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

  const performCheck = async (silent = true) => {
    if (!isDesktop) return;
    try {
      if (!silent) setIsChecking(true);
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check({ headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } });
      
      if (update) {
        setUpdateAvailable(update);
        if (!silent) toast.success(`Update v${update.version} is available!`);
      } else {
        setUpdateAvailable(null);
        if (!silent) toast('You are on the latest version.', { icon: '✨' });
      }
    } catch (err: any) {
      console.error('Update check failed:', err);
      if (!silent) {
        // Don't scare users with error toasts for 404s (no update published yet)
        if (err.message?.includes('404') || err.message?.includes('Not Found')) {
          toast('You are on the latest version.', { icon: '✨' });
        } else {
          toast.error(`Update check failed: ${err.message || 'Network error'}`);
        }
      }
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isDesktop) return;
    
    // Initial check on mount
    performCheck(true);

    // Check every 24 hours
    const interval = setInterval(() => {
      performCheck(true);
    }, 1000 * 60 * 60 * 24);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateClick = async () => {
    if (!isDesktop) return;
    
    // If no update available, check manually
    if (!updateAvailable) {
      await performCheck(false);
      return;
    }

    try {
      const { ask } = await import('@tauri-apps/plugin-dialog');
      const { exit } = await import('@tauri-apps/plugin-process');

      const confirmed = await ask(
        `Update to v${updateAvailable.version} is available!\n\n` +
        `Release Notes:\n${updateAvailable.body || 'Bug fixes and performance improvements.'}\n\n` +
        `Do you want to download and install it now?`,
        { 
          title: 'App Update Available', 
          kind: 'info',
          okLabel: 'Install & Restart',
          cancelLabel: 'Later'
        }
      );

      if (!confirmed) return;

      setIsDownloading(true);
      const toastId = toast.loading('Downloading update (0%)...');

      let downloadedBytes = 0;
      let totalBytes = 0;

      // Download AND install with progress tracking
      await updateAvailable.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            totalBytes = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloadedBytes += event.data.chunkLength || 0;
            if (totalBytes > 0) {
              const pct = Math.round((downloadedBytes / totalBytes) * 100);
              setDownloadProgress(pct);
              toast.loading(`Downloading update (${pct}%)...`, { id: toastId });
            } else {
              toast.loading('Downloading update...', { id: toastId });
            }
            break;
          case 'Finished':
            toast.loading('Applying update & preparing restart...', { id: toastId });
            break;
        }
      });

      toast.success('Update installed! Restarting...', { id: toastId });

      // CRITICAL: Use exit(0) on Windows so the NSIS installer can overwrite the executable.
      // Do NOT use relaunch(), as it spawns a new instance immediately and locks the file.
      await exit(0);

    } catch (e: any) {
      console.error('Failed to download/install update:', e);
      toast.error(`Update failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
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
      title={updateAvailable ? `Update v${updateAvailable.version} available!` : 'Check for updates'}
    >
      {updateAvailable ? (
        <>
          <DownloadCloud size={14} className={isDownloading ? 'animate-bounce' : 'animate-pulse'} />
          <span>
            {isDownloading
              ? downloadProgress > 0
                ? `Updating ${downloadProgress}%`
                : 'Updating...'
              : 'Update Available'}
          </span>
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
