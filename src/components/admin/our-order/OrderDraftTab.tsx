import React, { useMemo } from 'react';
import { Package, Sparkles, Plus, Check, Building2, Phone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OurOrderItem } from '../../../types/index';

interface OrderDraftTabProps {
  ourOrderList: OurOrderItem[];
  onRemoveItem: (id: string) => void;
  onClearDraft: () => void;
  onConfirmOrder: () => void;
  draftSupplier: { name: string; phone: string };
  setDraftSupplier: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  savedSuppliers: string[];
  onOpenLowStockWizard: () => void;
  onOpenAddChoiceModal: () => void;
  lowStockCount: number;
}

export const OrderDraftTab: React.FC<OrderDraftTabProps> = ({
  ourOrderList,
  onRemoveItem,
  onClearDraft,
  onConfirmOrder,
  draftSupplier,
  setDraftSupplier,
  savedSuppliers,
  onOpenLowStockWizard,
  onOpenAddChoiceModal,
  lowStockCount
}) => {
  const draftTotalCost = useMemo(() => {
    return ourOrderList.reduce((acc, item) => {
      return acc + (item.totalCost || item.quantityNeeded * (item.costPrice || 0));
    }, 0);
  }, [ourOrderList]);

  const draftTotalPieces = useMemo(() => {
    return ourOrderList.reduce((acc, item) => acc + item.quantityNeeded, 0);
  }, [ourOrderList]);

  if (ourOrderList.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Package size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Your Order Draft is Empty</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          Add items to your purchase requisition by scanning low stock items, restocking existing products, or defining
          new items.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLowStockWizard}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles size={14} /> Auto-Scan Low Stock ({lowStockCount})
          </button>
          <button
            onClick={onOpenAddChoiceModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Items Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Draft Actions & Summary Bar */}
      <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Items
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{ourOrderList.length}</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Base Pieces
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {draftTotalPieces.toLocaleString()} pcs
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Estimated Total Cost
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">
              Rs {draftTotalCost.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => {
              toast((t) => (
                <div className="flex flex-col gap-2 p-1">
                  <span className="font-bold text-slate-900 text-sm">Clear entire draft list?</span>
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      className="px-3 py-1 bg-slate-200 text-xs font-semibold rounded text-slate-800"
                      onClick={() => toast.dismiss(t.id)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded"
                      onClick={() => {
                        toast.dismiss(t.id);
                        onClearDraft();
                        toast.success('Draft cleared');
                      }}
                    >
                      Yes, Clear
                    </button>
                  </div>
                </div>
              ));
            }}
            className="px-3.5 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/40 transition-colors"
          >
            Clear Draft
          </button>
          <button
            onClick={onConfirmOrder}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Check size={16} /> Confirm & Place Order
          </button>
        </div>
      </div>

      {/* Vendor / Supplier Tagging Card */}
      <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 size={15} className="text-blue-600" /> Vendor / Supplier Tagging (Optional)
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tag orders to distributors for automatic WhatsApp routing & ledger billing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Distributor / Supplier Name
            </label>
            <input
              type="text"
              list="supplier-suggestions"
              placeholder="e.g. National Foods, Unilever, Habib Oil..."
              value={draftSupplier.name}
              onChange={(e) => setDraftSupplier((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
            <datalist id="supplier-suggestions">
              {savedSuppliers.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Supplier WhatsApp / Phone (Optional)
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 03001234567"
                value={draftSupplier.phone}
                onChange={(e) => setDraftSupplier((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Clickable Supplier Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Select:</span>
          {savedSuppliers.slice(0, 6).map((sup) => (
            <button
              key={sup}
              type="button"
              onClick={() => setDraftSupplier((prev) => ({ ...prev, name: sup }))}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                draftSupplier.name === sup
                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 font-medium'
              }`}
            >
              {sup}
            </button>
          ))}
        </div>
      </div>

      {/* Draft Items Table */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800">
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Product Name
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Barcode / SKU
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">
                  Unit & Qty
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-center">
                  Total Pieces
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">
                  Cost / Pc
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">
                  Total Cost
                </th>
                <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ourOrderList.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 dark:border-zinc-800/40 hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.isNewProduct && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                          NEW PRODUCT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <div>{item.barcode || '-'}</div>
                    {item.sku && <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded text-xs">
                      {item.unitQuantity || 1} {item.unit || 'Pcs'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                    {item.quantityNeeded} pcs
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                    Rs {(item.costPrice || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-50">
                    Rs {(item.totalCost || item.quantityNeeded * (item.costPrice || 0)).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
