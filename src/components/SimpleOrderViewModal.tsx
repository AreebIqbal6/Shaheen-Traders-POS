import type { Order } from '../types/index';
import React from 'react';
import { X } from 'lucide-react';

interface SimpleOrderViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function SimpleOrderViewModal({ isOpen, onClose, order }: SimpleOrderViewModalProps) {
  if (!isOpen || !order) return null;

  const items = order.items || [];
  const total = order.total || order.total_amount || 0;
  const clientName = order.client_name || order.clientName || order.shop_name || 'Walk-in';
  const orderId = order.receipt_number || order.id || 'Unknown';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-700" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-700 shrink-0 bg-slate-50 dark:bg-zinc-900/50 rounded-t-lg">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Order Details
              <span className="text-sm font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {orderId}
              </span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{clientName}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400">
                <th className="py-2 px-2 font-semibold">Item</th>
                <th className="py-2 px-2 font-semibold text-center w-24">Qty</th>
                <th className="py-2 px-2 font-semibold text-right w-32">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3 px-2 text-slate-800 dark:text-slate-200 font-medium">
                    {item.name || item.product_name}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-zinc-900/30">
                    {item.quantity} {item.uom || 'Pcs'}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-800 dark:text-slate-200 font-mono">
                    Rs. {(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">No items found in this order.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 rounded-b-lg flex justify-between items-center shrink-0">
          <span className="text-slate-500 font-medium">Total Amount</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            Rs. {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

      </div>
    </div>
  );
}
