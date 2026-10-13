import React, { useState } from 'react';
import { Sparkles, X, Search } from 'lucide-react';
import type { Product, UOMType } from '../../../types/index';
import { calculateTotalBasePieces } from '../../../utils/accounting';

export interface LowStockWizardItem {
  product: Product;
  selected: boolean;
  unit: UOMType;
  unitQuantity: number;
  costPrice: number;
}

interface LowStockWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  wizardItems: LowStockWizardItem[];
  setWizardItems: React.Dispatch<React.SetStateAction<LowStockWizardItem[]>>;
  onConfirm: () => void;
}

export const LowStockWizardModal: React.FC<LowStockWizardModalProps> = ({
  isOpen,
  onClose,
  wizardItems,
  setWizardItems,
  onConfirm
}) => {
  const [wizardSearch, setWizardSearch] = useState('');

  if (!isOpen) return null;

  const filteredItems = wizardItems.filter(
    (item) =>
      !wizardSearch.trim() ||
      item.product.name.toLowerCase().includes(wizardSearch.toLowerCase()) ||
      item.product.barcode?.toLowerCase().includes(wizardSearch.toLowerCase()) ||
      item.product.sku?.toLowerCase().includes(wizardSearch.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" /> Low & Zero Stock Restock Wizard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Found {wizardItems.length} products with stock below threshold. Review item-wise and set quantities.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-xs bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder="Filter low stock items..."
              value={wizardSearch}
              onChange={(e) => setWizardSearch(e.target.value)}
              className="bg-transparent text-xs outline-none w-full text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWizardItems((prev) => prev.map((i) => ({ ...i, selected: true })))}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setWizardItems((prev) => prev.map((i) => ({ ...i, selected: false })))}
              className="text-xs font-semibold text-slate-500 hover:underline"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Wizard Items Table */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {filteredItems.map((item, idx) => {
              const totalPcs = calculateTotalBasePieces(
                item.unit,
                item.unitQuantity,
                item.product.pcsPerBox,
                item.product.boxPerCtn
              );
              const totalCost = item.costPrice * totalPcs;

              return (
                <div
                  key={item.product.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    item.selected
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setWizardItems((prev) =>
                          prev.map((it) => (it.product.id === item.product.id ? { ...it, selected: checked } : it))
                        );
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.product.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            item.product.stock <= 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          Stock: {item.product.stock} pcs
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Barcode: {item.product.barcode || '-'} • SKU: {item.product.sku || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Order Inputs */}
                  {item.selected && (
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">Unit:</label>
                        <select
                          value={item.unit}
                          onChange={(e) => {
                            const u = e.target.value as UOMType;
                            setWizardItems((prev) =>
                              prev.map((it) => (it.product.id === item.product.id ? { ...it, unit: u } : it))
                            );
                          }}
                          className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-semibold"
                        >
                          <option value="Pcs">Pieces</option>
                          <option value="Box">Boxes ({item.product.pcsPerBox || 12} pcs)</option>
                          <option value="Ctn">
                            Cartons ({(item.product.pcsPerBox || 12) * (item.product.boxPerCtn || 6)} pcs)
                          </option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">Qty:</label>
                        <input
                          type="number"
                          min={1}
                          value={item.unitQuantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value) || 0;
                            setWizardItems((prev) =>
                              prev.map((it) => (it.product.id === item.product.id ? { ...it, unitQuantity: q } : it))
                            );
                          }}
                          className="w-16 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-bold font-mono text-center"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-semibold text-slate-500">Cost/Pc:</label>
                        <input
                          type="number"
                          min={0}
                          value={item.costPrice}
                          onChange={(e) => {
                            const cp = parseFloat(e.target.value) || 0;
                            setWizardItems((prev) =>
                              prev.map((it) => (it.product.id === item.product.id ? { ...it, costPrice: cp } : it))
                            );
                          }}
                          className="w-20 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2 py-1 text-xs font-bold font-mono text-right"
                        />
                      </div>

                      <div className="text-right min-w-[90px]">
                        <span className="text-[10px] text-slate-400 block">{totalPcs} pcs</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Rs {totalCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Selected: {wizardItems.filter((i) => i.selected).length} items
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 text-xs font-semibold">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
            >
              Add Selected to Order Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
