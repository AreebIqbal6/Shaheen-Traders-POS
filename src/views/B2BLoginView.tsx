import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, ArrowRight, User, Key, WifiOff } from 'lucide-react';
import { verifyPassword } from '../utils/cryptoUtils';

export default function B2BLoginView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // We are storing the offline login explicitly since Bookers use weak network
  const handleOfflineLogin = async () => {
    const cachedBookers = localStorage.getItem('shaheen_bookers');
    if (cachedBookers) {
      const bookers = JSON.parse(cachedBookers);
      const target = bookers.find((b: any) => b.username === username);
      if (target && await verifyPassword(password, target.auth_token)) {
        // Authenticated offline!
        localStorage.setItem('shaheen_active_booker', JSON.stringify(target));
        localStorage.setItem('shaheen_bookerName', target.name);
        onLoginSuccess();
        return true;
      }
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!username || !password) throw new Error('Username and password are required');
      
      // Try offline login first (instant speed for field workers)
      const offlineSuccess = await handleOfflineLogin();
      
      if (!offlineSuccess) {
        // If offline fails (maybe first login on this device), try online auth
        // Assuming we registered them via Supabase Auth with an email mapping
        // OR we can query the 'bookers' table directly if we don't have RLS blocking it
        
        // Since we stored btoa(password) in bookers table for simple fallback:
        const { data, error: fetchErr } = await supabase
          .from('bookers')
          .select('*')
          .eq('username', username)
          .single();
          
        if (fetchErr || !data) {
          throw new Error('Invalid username or password.');
        }

        const isValid = await verifyPassword(password, data.auth_token);
        if (!isValid) {
          throw new Error('Invalid username or password.');
        }

        // Success! Cache it for future offline use
        const cachedBookers = localStorage.getItem('shaheen_bookers');
        let bookersList = cachedBookers ? JSON.parse(cachedBookers) : [];
        if (!bookersList.find((b: any) => b.username === data.username)) {
          bookersList.push(data);
          localStorage.setItem('shaheen_bookers', JSON.stringify(bookersList));
        }

        localStorage.setItem('shaheen_active_booker', JSON.stringify(data));
        localStorage.setItem('shaheen_bookerName', data.name);
        onLoginSuccess();
      }

    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Failed to authenticate. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ zoom: 0.9 }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 mb-5 transform hover:scale-105 transition-transform duration-300">
            <img src="/logo_transparent.png" alt="Shaheen Traders Booker Portal" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Booker Portal
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            Secure Field Agent Access
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 dark:border-zinc-800/50/50">
          
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wide border border-amber-200 dark:border-amber-800/30">
             <WifiOff size={16} /> Offline Login Supported
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-white font-medium transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-white font-medium transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800/30">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In Securely <ArrowRight size={18} />
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
