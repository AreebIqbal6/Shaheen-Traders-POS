import React from 'react';
import { X, Loader2, ScanLine } from 'lucide-react';
import type { Product } from '../../types/index';
import CameraScanner from '../CameraScanner';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formData: {
    barcode: string;
    name: string;
    price: number;
    stock: number;
    sku?: string;
    item_type?: 'Local' | 'Imported';
    retail_price?: number;
    pcsPerBox?: number;
    boxPerCtn?: number;
    minStock?: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  isLoadingApi: boolean;
  isScannerActive: boolean;
  setIsScannerActive: (val: boolean) => void;
  fetchProductDetails: (barcode: string) => Promise<void>;
  onSave: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  barcodeInputRef,
  isLoadingApi,
  isScannerActive,
  setIsScannerActive,
  fetchProductDetails,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 shadow-xl rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-zinc-800/50 flex justify-between items-center bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto custom-scrollbar">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Barcode
                </label>
              </div>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => {
                    setFormData({ ...formData, barcode: e.target.value });
                    if (e.target.value.length >= 12 && !editingProduct) {
                      fetchProductDetails(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!editingProduct && formData.barcode) {
                        fetchProductDetails(formData.barcode);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!editingProduct && formData.barcode) fetchProductDetails(formData.barcode);
                  }}
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono text-[13px] pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Scan or auto-generated"
                />
                {isLoadingApi ? (
                  <Loader2 size={16} className="absolute right-3 top-3 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : (
                  <button
                    onClick={() => setIsScannerActive(!isScannerActive)}
                    className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${
                      isScannerActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ScanLine size={16} />
                  </button>
                )}
              </div>

              {isScannerActive && (
                <CameraScanner
                  onClose={() => setIsScannerActive(false)}
                  onScan={(decodedText) => {
                    setFormData((prev: any) => ({ ...prev, barcode: decodedText }));
                    setIsScannerActive(false);
                    if (!editingProduct) {
                      fetchProductDetails(decodedText);
                    }
                  }}
                />
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-medium text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:text-slate-500"
                placeholder="e.g. Lays French Cheese"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                Item Type
              </label>
              <select
                value={formData.item_type || 'Local'}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as 'Local' | 'Imported' })}
                className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-medium text-[13px] text-slate-900 dark:text-slate-50"
              >
                <option value="Local">Local</option>
                <option value="Imported">Imported</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                SKU Code
              </label>
              <input
                type="text"
                disabled
                readOnly
                value={formData.sku || ''}
                className="w-full bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 font-mono font-bold text-[13px] text-slate-500 dark:text-slate-500 opacity-60 cursor-not-allowed"
                placeholder="Auto-generated"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Price (PKR) / Pc
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-blue-600 dark:text-blue-400 placeholder:text-blue-600/40 dark:placeholder:text-blue-400/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Total Stock (Pcs)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.stock === 0 ? '' : formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Min Stock (Alert)
                </label>
                <input
                  type="number"
                  placeholder="5"
                  value={formData.minStock === 5 || formData.minStock === 0 ? '' : formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value === '' ? 5 : parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500 transition-all font-mono font-bold text-[13px] text-amber-600 dark:text-amber-500 placeholder:text-amber-600/40 dark:placeholder:text-amber-500/40"
                />
              </div>
            </div>

            {/* UOM Conversions & Retail Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-1 sm:mt-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block whitespace-nowrap">
                  Retail Price (PKR)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={formData.retail_price === undefined || formData.retail_price === null ? '' : formData.retail_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retail_price: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })
                  }
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Pcs per Box
                </label>
                <input
                  type="number"
                  value={formData.pcsPerBox || ''}
                  onChange={(e) => setFormData({ ...formData, pcsPerBox: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Boxes per Ctn
                </label>
                <input
                  type="number"
                  value={formData.boxPerCtn || ''}
                  onChange={(e) => setFormData({ ...formData, boxPerCtn: parseInt(e.target.value) || undefined })}
                  placeholder="Optional"
                  className="w-full bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-all font-mono font-bold text-[13px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Quick Stock Adder */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg">
              <label className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2 block">
                Quick Stock Adder
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="quick-stock-amt"
                  placeholder="Qty"
                  className="w-20 bg-white dark:bg-zinc-900/60 border border-blue-200 dark:border-blue-800 rounded px-2 py-2 text-[13px] font-mono focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
                <select
                  id="quick-stock-unit"
                  className="flex-1 bg-white dark:bg-zinc-900/60 border border-blue-200 dark:border-blue-800 rounded px-2 py-2 text-[13px] focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="Pcs">Pieces</option>
                  <option value="Box" disabled={!formData.pcsPerBox}>
                    Boxes {!formData.pcsPerBox ? '(Set Pcs/Box first)' : ''}
                  </option>
                  <option value="Ctn" disabled={!(formData.pcsPerBox && formData.boxPerCtn)}>
                    Cartons {!(formData.pcsPerBox && formData.boxPerCtn) ? '(Set Box/Ctn first)' : ''}
                  </option>
                </select>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const amt =
                      parseInt((document.getElementById('quick-stock-amt') as HTMLInputElement).value) || 0;
                    const unit = (document.getElementById('quick-stock-unit') as HTMLSelectElement).value;
                    let multiplier = 1;
                    if (unit === 'Box') multiplier = formData.pcsPerBox || 1;
                    if (unit === 'Ctn') multiplier = (formData.pcsPerBox || 1) * (formData.boxPerCtn || 1);
                    setFormData({ ...formData, stock: (formData.stock || 0) + amt * multiplier });
                    (document.getElementById('quick-stock-amt') as HTMLInputElement).value = '';
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-[13px] font-bold shadow-sm transition-colors"
                >
                  Add Stock
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-200 dark:border-zinc-800/50 flex justify-end gap-3 bg-slate-100 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-50 rounded-lg transition-colors text-[13px]"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-[13px] border-t border-slate-300 dark:border-slate-600"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
};
