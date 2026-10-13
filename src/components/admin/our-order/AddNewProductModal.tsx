import React, { useState, useMemo, useEffect } from 'react';
import { Plus, X, ScanLine, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraScanner from '../../CameraScanner';
import { generateUUID } from '../../../utils/uuid';
import { getNextSKU } from '../../../views/ProductsView';
import type { Product, OurOrderItem, UOMType } from '../../../types/index';
import { calculateTotalBasePieces } from '../../../utils/accounting';

interface AddNewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: OurOrderItem) => void;
  existingProducts: Product[];
}

export const AddNewProductModal: React.FC<AddNewProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingProducts
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [itemType, setItemType] = useState<'Local' | 'Imported'>('Local');
  const [price, setPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number | undefined>(undefined);
  const [pcsPerBox, setPcsPerBox] = useState<number | undefined>(12);
  const [boxPerCtn, setBoxPerCtn] = useState<number | undefined>(6);
  const [minStock, setMinStock] = useState<number>(5);
  const [orderUnit, setOrderUnit] = useState<UOMType>('Box');
  const [orderQty, setOrderQty] = useState<number>(2);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const autoSku = useMemo(() => {
    return getNextSKU(existingProducts);
  }, [existingProducts]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setBarcode('BC-' + Date.now().toString(36).toUpperCase());
      setItemType('Local');
      setPrice(0);
      setRetailPrice(undefined);
      setPcsPerBox(12);
      setBoxPerCtn(6);
      setMinStock(5);
      setOrderUnit('Box');
      setOrderQty(2);
      setIsScannerActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product Name is required.');
      return;
    }
    if (orderQty <= 0) {
      toast.error('Order quantity must be greater than zero.');
      return;
    }

    const totalPcs = calculateTotalBasePieces(orderUnit, orderQty, pcsPerBox, boxPerCtn);
    const totalCost = (price || 0) * totalPcs;
    const tempId = generateUUID();

    const newItem: OurOrderItem = {
      id: tempId,
      name: name.trim(),
      barcode: barcode.trim(),
      sku: autoSku,
      unit: orderUnit,
      unitQuantity: orderQty,
      quantityNeeded: totalPcs,
      costPrice: price,
      totalCost,
      pcsPerBox,
      boxPerCtn,
      retailPrice,
      category: 'General',
      itemType,
      minStock,
      isNewProduct: true,
      status: 'PENDING'
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-emerald-600" /> Add New Product to Our Order
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Left Column: Product Definition */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Product Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ariel Washing Powder 1kg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Barcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerActive(!isScannerActive)}
                  className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <ScanLine size={16} />
                </button>
              </div>
              {isScannerActive && (
                <CameraScanner
                  onClose={() => setIsScannerActive(false)}
                  onScan={(val) => {
                    setBarcode(val);
                    setIsScannerActive(false);
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Item Type
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as 'Local' | 'Imported')}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-medium"
                >
                  <option value="Local">Local</option>
                  <option value="Imported">Imported</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  SKU Code
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={autoSku}
                  className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-xs font-mono font-bold text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pcs/Box
                </label>
                <input
                  type="number"
                  value={pcsPerBox || ''}
                  onChange={(e) => setPcsPerBox(parseInt(e.target.value) || undefined)}
                  placeholder="12"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Box/Ctn
                </label>
                <input
                  type="number"
                  value={boxPerCtn || ''}
                  onChange={(e) => setBoxPerCtn(parseInt(e.target.value) || undefined)}
                  placeholder="6"
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Min Stock
                </label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Order Requisition */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-blue-500" /> Pricing & Initial Order
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Cost / Pc (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={price === 0 ? '' : price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Retail Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={retailPrice === undefined ? '' : retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    placeholder="Optional"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Requisition Quantity
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Unit</label>
                    <select
                      value={orderUnit}
                      onChange={(e) => setOrderUnit(e.target.value as UOMType)}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="Pcs">Pieces</option>
                      <option value="Box">Boxes ({pcsPerBox || 12} pcs/box)</option>
                      <option value="Ctn">Cartons ({(pcsPerBox || 12) * (boxPerCtn || 6)} pcs/ctn)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Amount</label>
                    <input
                      type="number"
                      min={1}
                      value={orderQty}
                      onChange={(e) => setOrderQty(parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center text-xs">
                  <span className="text-blue-700 dark:text-blue-300">Total Base Pieces:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-100 font-mono">
                    {calculateTotalBasePieces(orderUnit, orderQty, pcsPerBox, boxPerCtn)} pcs
                  </span>
                </div>

                <div className="flex justify-between items-center font-bold text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Order Cost:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">
                    Rs {(price * calculateTotalBasePieces(orderUnit, orderQty, pcsPerBox, boxPerCtn)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Add to Our Order Draft
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
