import React, { useState, useEffect } from 'react';

export default function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeZone = localStorage.getItem('shaheen_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-full border border-slate-200 dark:border-zinc-800/50 shadow-sm self-start text-xs font-semibold text-slate-700 dark:text-slate-300">
      <span className="tracking-wide whitespace-nowrap">{currentTime.toLocaleDateString('en-GB', { timeZone }).replace(/\//g, '-')}</span>
      <span className="hidden sm:inline opacity-50">&bull;</span>
      <span className="tracking-wide whitespace-nowrap">{currentTime.toLocaleTimeString('en-US', { timeZone, hour12: true })}</span>
    </div>
  );
}
