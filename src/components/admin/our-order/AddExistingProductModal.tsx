import React, { useState, useMemo } from 'react';
import { Boxes, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, UOMType } from '../../../types/index';
import { calculateTotalBasePieces } from '../../../utils/accounting';

interface AddExistingProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAdd: (product: Product, unit: UOMType, quantity: number, costPrice: number) => void;
}

export const AddExistingProductModal: React.FC<AddExistingProductModalProps> = ({
  isOpen,
  onClose,
  products,
  onAdd
}) => {
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState<UOMType>('Pcs');
  const [quantity, setQuantity] = useState<number>(1);
  const [costPrice, setCostPrice] = useState<number>(0);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedId);
  }, [products, selectedId]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products.slice(0, 50);
    const q = search.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [products, search]);

  const handleSelect = (p: Product) => {
    setSelectedId(p.id);
    setCostPrice(p.price || 0);
    const defUnit: UOMType = p.pcsPerBox ? 'Box' : 'Pcs';
    setUnit(defUnit);
    setQuantity(defUnit === 'Box' ? 2 : 12);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Please select a product from the list.');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }

    onAdd(selectedProduct, unit, quantity, costPrice);
    onClose();
    setSelectedId('');
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes size={18} className="text-blue-600" /> Restock Existing Product
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">
              Select Product from Inventory
            </label>
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, barcode or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-lg divide-y divide-slate-100 dark:divide-zinc-800 custom-scrollbar">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`p-2.5 text-xs flex justify-between items-center cursor-pointer transition-colors ${
                    selectedId === p.id
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div>
                    <div>{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.barcode || 'No barcode'} • SKU: {p.sku || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Stock: {p.stock || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 flex flex-col gap-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white">{selectedProduct.name}</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UOMType)}
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Pcs">Pieces</option>
                    <option value="Box">Boxes ({selectedProduct.pcsPerBox || 12} pcs/box)</option>
                    <option value="Ctn">
                      Cartons ({(selectedProduct.pcsPerBox || 12) * (selectedProduct.boxPerCtn || 6)} pcs/ctn)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Set Purchase Price / Pc (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-blue-600"
                />
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Base Pieces:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {calculateTotalBasePieces(unit, quantity, selectedProduct.pcsPerBox, selectedProduct.boxPerCtn)} pcs
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700 dark:text-slate-300">Total Line Cost:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  Rs{' '}
                  {(
                    costPrice *
                    calculateTotalBasePieces(unit, quantity, selectedProduct.pcsPerBox, selectedProduct.boxPerCtn)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProduct}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Add to Order Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
