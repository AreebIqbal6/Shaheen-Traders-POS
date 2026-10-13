import React from 'react';
import { Package, X, Check } from 'lucide-react';
import type { OurOrderItem, ConfirmedPurchaseOrder } from '../../../types/index';
import { calculateTotalBasePieces } from '../../../utils/accounting';

interface ReceiveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  item: OurOrderItem | null;
  order: ConfirmedPurchaseOrder | null;
  qtyToReceive: number;
  setQtyToReceive: React.Dispatch<React.SetStateAction<number>>;
  markShortShipped: boolean;
  setMarkShortShipped: React.Dispatch<React.SetStateAction<boolean>>;
  updateMasterCost: boolean;
  setUpdateMasterCost: React.Dispatch<React.SetStateAction<boolean>>;
  paymentMethod: 'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE';
  setPaymentMethod: React.Dispatch<React.SetStateAction<'CASH' | 'BANK' | 'VENDOR_CREDIT' | 'NONE'>>;
  onConfirm: () => void;
}

export const ReceiveItemModal: React.FC<ReceiveItemModalProps> = ({
  isOpen,
  onClose,
  item,
  qtyToReceive,
  setQtyToReceive,
  markShortShipped,
  setMarkShortShipped,
  updateMasterCost,
  setUpdateMasterCost,
  paymentMethod,
  setPaymentMethod,
  onConfirm
}) => {
  if (!isOpen || !item) return null;

  const maxRem = Math.max(1, (item.unitQuantity || 1) - (item.receivedUnitQuantity || 0));

  const totalPieces = calculateTotalBasePieces(
    item.unit || 'Pcs',
    qtyToReceive,
    item.pcsPerBox,
    item.boxPerCtn
  );

  const totalValuation = totalPieces * (item.costPrice || 0);

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
              <Package size={18} className="text-emerald-600" /> Receive Stock Delivery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record physical stock arrival into your live inventory.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Product & Order Details */}
        <div className="bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">{item.name}</span>
              <span className="text-xs font-mono text-slate-400">
                Barcode: {item.barcode || '-'} • SKU: {item.sku || '-'}
              </span>
            </div>
            {item.isNewProduct && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                NEW PRODUCT
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-zinc-700/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Ordered:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {item.unitQuantity || 1} {item.unit || 'Pcs'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Previously Rcvd:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {item.receivedUnitQuantity || 0} {item.unit || 'Pcs'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Remaining:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {Math.max(0, (item.unitQuantity || 1) - (item.receivedUnitQuantity || 0))} {item.unit || 'Pcs'}
              </span>
            </div>
          </div>
        </div>

        {/* Arrived Quantity Input */}
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Quantity Arrived Today (in {item.unit || 'Pcs'})
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={qtyToReceive}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQtyToReceive(val);
                if (val >= maxRem) {
                  setMarkShortShipped(false);
                }
              }}
              className="w-28 bg-white dark:bg-zinc-800 border-2 border-emerald-500 rounded-lg px-3 py-2 text-base font-bold font-mono text-center text-slate-900 dark:text-white outline-none"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>Converts to: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                +{totalPieces} base pieces
              </span>
              <div className="text-[11px] font-mono text-slate-400">
                Valued at Rs {totalValuation.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Short Delivery Checkbox */}
        {qtyToReceive < maxRem && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg flex items-start gap-2.5">
            <input
              type="checkbox"
              id="markShortShipped"
              checked={markShortShipped}
              onChange={(e) => setMarkShortShipped(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="markShortShipped"
              className="text-xs text-amber-900 dark:text-amber-200 font-medium cursor-pointer"
            >
              <span className="font-bold block">Mark Remaining Balance as Short-Shipped / Closed</span>
              Check this if the supplier cannot deliver the remaining units and this order item should be marked complete.
            </label>
          </div>
        )}

        {/* Master Cost Update Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-700">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Update Master Product Cost Price
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Set master inventory price to Rs {item.costPrice || 0}/pc
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
            Payment & Financial Settlement
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
          >
            <option value="NONE">Stock Only (No cash or ledger movement)</option>
            <option value="CASH">Cash Drawer Out (Deduct from Daily Cash Balance)</option>
            <option value="VENDOR_CREDIT">Vendor Credit Bill (Record in Accounts Payable Ledger)</option>
            <option value="BANK">Bank Transfer (Record as bank expense)</option>
          </select>
        </div>

        {/* Modal Actions */}
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
            <Check size={15} /> Confirm Reception
          </button>
        </div>
      </div>
    </div>
  );
};
