import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthViewProps {
  onLogin: (bookerName?: string) => void;
}

export default function AuthView({ onLogin }: AuthViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Verify if the user is an admin
      // Note: A true enterprise app would check a 'profiles' table or JWT claim here.
      // We will trust the successful auth for now, but restrict RLS on the DB side.
      if (data.session) {
        onLogin('Admin');
      }
    } catch (err: unknown) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders';
  const logo = localStorage.getItem('shaheen_logo');

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0a0c] flex items-center justify-center font-sans">
      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg shadow-sm p-10 w-[440px] max-w-[90%] flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-28 h-28 mb-4 transform hover:scale-105 transition-transform duration-300 rounded-xl overflow-hidden">
          {logo ? (
            <img src={logo} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
          ) : (
            <img src="/logo_transparent.png" alt="Shaheen Traders" className="w-full h-full object-contain mix-blend-multiply" />
          )}
        </div>
        
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-1">{storeName}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 text-center flex items-center justify-center gap-1.5 font-medium">
          <Lock size={14} className="text-indigo-500" /> Admin Access Portal
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Admin Email</label>
            <input 
              type="email" 
              placeholder="admin@shaheentraders.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onPaste={e => {
                // Prevent clipboard attacks on sensitive fields
                e.preventDefault();
                alert("Pasting disabled for security reasons.");
              }}
              className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                toast.error("Pasting disabled for security reasons.");
              }}
              className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {error && <p className="text-rose-500 text-xs font-semibold text-center mt-1 bg-rose-50 dark:bg-rose-900/20 p-2 rounded">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white font-bold text-sm rounded-md py-3 mt-2 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access Terminal'}
          </button>
        </form>
      </div>
    </div>
  );
}
