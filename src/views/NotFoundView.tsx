import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 font-sans">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 md:p-12 shadow-xl max-w-lg w-full text-center flex flex-col items-center gap-6 animate-enter">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle size={40} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Page not found</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            The page you're looking for doesn't exist, has been moved, or you don't have permission to view it.
          </p>
        </div>
        <Link 
          to="/" 
          className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
