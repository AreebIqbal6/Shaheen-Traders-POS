import React from 'react';
import { CheckCheck, X } from 'lucide-react';
import type { ConfirmedPurchaseOrder } from '../../../types/index';

interface ReceiveAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ConfirmedPurchaseOrder | null;
  updateMasterCost: boolean;
  setUpdateMasterCost: React.Dispatch<React.SetStateAction<boolean>>;
  paymentMethod: 'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE';
  setPaymentMethod: React.Dispatch<React.SetStateAction<'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE'>>;
  onConfirm: () => void;
}

export const ReceiveAllModal: React.FC<ReceiveAllModalProps> = ({
  isOpen,
  onClose,
  order,
  updateMasterCost,
  setUpdateMasterCost,
  paymentMethod,
  setPaymentMethod,
  onConfirm
}) => {
  if (!isOpen || !order) return null;

  const unreceivedItems = order.items.filter((i) => i.status !== 'RECEIVED');
  const unreceivedPieces = unreceivedItems.reduce(
    (acc, i) => acc + Math.max(0, i.quantityNeeded - (i.receivedQuantityNeeded || 0)),
    0
  );
  const unreceivedTotalValue = unreceivedItems.reduce((acc, i) => {
    const remPieces = Math.max(0, i.quantityNeeded - (i.receivedQuantityNeeded || 0));
    return acc + remPieces * (i.costPrice || 0);
  }, 0);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCheck size={20} className="text-emerald-600" /> Receive All Order Items
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Order #{order.orderNumber} • {order.supplierName || 'General Vendor'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          This will receive all unreceived line items in this order directly into live inventory at their set purchase
          rates.
        </p>

        {/* Unreceived Summary */}
        <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Unreceived Line Items:</span>
            <span className="font-bold text-slate-900 dark:text-white">{unreceivedItems.length} items</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Unreceived Base Pieces:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              +{unreceivedPieces} pcs
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-zinc-700">
            <span className="text-slate-700 dark:text-slate-300">Total Value:</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              Rs {unreceivedTotalValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Master Cost Update Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Update Master Product Cost Prices
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Update master inventory price for all received products
            </span>
          </div>
          <input
            type="checkbox"
            checked={updateMasterCost}
            onChange={(e) => setUpdateMasterCost(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
        </div>

        {/* Financial Settlement */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Payment & Settlement Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="NONE">Stock Only (No cash or ledger movement)</option>
            <option value="CASH">Deduct from Cash Register Drawer (Cash Out / Expense)</option>
            <option value="VENDOR_CREDIT">Record as Vendor Credit Bill (Accounts Payable)</option>
            <option value="BANK">Bank Transfer (Record as bank expense)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <CheckCheck size={16} /> Confirm & Receive All
          </button>
        </div>
      </div>
    </div>
  );
};
