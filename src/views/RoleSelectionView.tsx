import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShoppingBag } from 'lucide-react';

const RoleSelectionView = () => {
  const navigate = useNavigate();

  const handleSelectRole = (role: 'admin' | 'booker') => {
    localStorage.setItem('shaheen_app_mode', role);
    navigate(role === 'admin' ? '/admin' : '/booker');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <img src={localStorage.getItem('shaheen_store_logo') || '/logo_transparent.png'} alt="Logo" className="w-24 h-24 mx-auto mb-6 drop-shadow-md object-contain" />
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Welcome to Shaheen POS</h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400">Please configure this device by selecting its primary role.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Option */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="group relative bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-500 overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Administrator POS</h2>
              <p className="text-slate-600 dark:text-zinc-400 mb-6">
                Full access to inventory management, sales processing, analytics, and settings. Recommended for the main store counter.
              </p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                Configure as Admin →
              </div>
            </div>
          </button>

          {/* Booker Option */}
          <button
            onClick={() => handleSelectRole('booker')}
            className="group relative bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 overflow-hidden text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Booker Portal</h2>
              <p className="text-slate-600 dark:text-zinc-400 mb-6">
                Streamlined interface for taking orders, managing carts, and offline syncing. Recommended for field tablets and order takers.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                Configure as Booker →
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionView;
