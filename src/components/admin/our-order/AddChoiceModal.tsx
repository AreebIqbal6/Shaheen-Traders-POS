import React from 'react';
import { X, Boxes, Plus, Sparkles } from 'lucide-react';

interface AddChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseExisting: () => void;
  onChooseNew: () => void;
  onChooseLowStock: () => void;
  lowStockCount: number;
}

export const AddChoiceModal: React.FC<AddChoiceModalProps> = ({
  isOpen,
  onClose,
  onChooseExisting,
  onChooseNew,
  onChooseLowStock,
  lowStockCount
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Items to Our Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Choose how you would like to requisition stock:
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              onChooseExisting();
            }}
            className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Boxes size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-blue-600">
                Restock Existing Product
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Choose from items already listed in your inventory and specify quantity & purchase cost.
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onChooseNew();
            }}
            className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 rounded-xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Plus size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-emerald-600">
                Add a Brand New Product
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Define a new product with full specifications (name, barcode, SKU, packaging). Added to inventory upon reception.
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onChooseLowStock();
            }}
            className="flex items-center gap-3 p-4 border border-slate-200 dark:border-zinc-800 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 rounded-xl transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1">
              <span className="font-bold text-sm text-slate-900 dark:text-white block group-hover:text-amber-600">
                Auto-Scan Low / Zero Stock ({lowStockCount})
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Automatically inspects inventory and asks item-wise to order items at or below critical levels.
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
