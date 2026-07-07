import React from 'react';
import { Users } from 'lucide-react';

export default function CustomersView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-900 flex flex-col items-center max-w-md text-center">
        <Users size={48} className="mb-4 text-orange-200" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Customer Management</h2>
        <p className="text-slate-500 dark:text-slate-400 text-[15px]">
          The customer loyalty and tracking module will be implemented here. Track walk-ins, loyalty points, and purchase history.
        </p>
      </div>
    </div>
  );
}
