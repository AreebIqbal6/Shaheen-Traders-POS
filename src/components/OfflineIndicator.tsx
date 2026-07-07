import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineTransition, setShowOnlineTransition] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineTransition(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineTransition(true);
      setTimeout(() => {
        setShowOnlineTransition(false);
      }, 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !showOnlineTransition) return null;

  if (showOnlineTransition) {
    return (
      <div className="bg-emerald-500 text-white text-xs font-bold py-1.5 px-4 flex justify-center items-center gap-2 fixed top-0 left-0 right-0 z-[100] shadow-sm transition-all duration-300">
        <Wifi size={16} />
        <span>Back Online!</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 flex justify-center items-center gap-2 fixed top-0 left-0 right-0 z-[100] shadow-sm">
      <WifiOff size={14} className="animate-pulse" />
      <span>YOU ARE CURRENTLY OFFLINE. APP IS RUNNING ON LOCAL CACHE.</span>
    </div>
  );
}
