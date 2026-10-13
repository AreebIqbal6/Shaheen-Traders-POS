import React from 'react';
import { Printer, X } from 'lucide-react';
import type { ConfirmedPurchaseOrder } from '../../../types/index';

interface PrintPOModalProps {
  order: ConfirmedPurchaseOrder | null;
  onClose: () => void;
}

export const PrintPOModal: React.FC<PrintPOModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50 print:hidden">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer size={18} className="text-blue-600" /> Purchase Requisition Voucher / P.O. Slip
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Printer size={14} /> Print Slip
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white text-slate-900" id="po-slip-print-content">
          {/* Slip Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">SHAHEEN GLOBAL TRADERS</h1>
              <p className="text-xs font-semibold text-slate-600">FMCG Wholesale & General Distribution</p>
              <p className="text-xs text-slate-500">Shaheen Market, Quetta, Pakistan • Tel: +92 81 2824567</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                Purchase Order (PO)
              </span>
              <div className="text-lg font-black font-mono mt-1">#{order.orderNumber}</div>
              <div className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Vendor & Order Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Supplier / Vendor:</span>
              <div className="font-black text-sm text-slate-900">
                {order.supplierName || 'General Wholesaler / Distributor'}
              </div>
              {order.supplierPhone && (
                <div className="text-slate-600 font-mono mt-0.5">Phone: {order.supplierPhone}</div>
              )}
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Requisition Status:</span>
              <div className="font-bold text-slate-800">
                {order.status === 'RECEIVED' ? 'Fully Received & Stocked' : 'Awaiting Delivery'}
              </div>
              <div className="text-slate-600 mt-0.5">Total Line Items: {order.items.length}</div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse text-xs mb-6">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-100">
                <th className="py-2 px-3 font-bold">#</th>
                <th className="py-2 px-3 font-bold">Item Description</th>
                <th className="py-2 px-3 font-bold">Barcode / SKU</th>
                <th className="py-2 px-3 font-bold text-center">Ordered Unit</th>
                <th className="py-2 px-3 font-bold text-center">Total Pcs</th>
                <th className="py-2 px-3 font-bold text-right">Cost / Pc</th>
                <th className="py-2 px-3 font-bold text-right">Total (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, idx) => (
                <tr key={it.id} className="border-b border-slate-200">
                  <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{it.name}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{it.barcode || it.sku || '-'}</td>
                  <td className="py-2 px-3 text-center font-bold">
                    {it.unitQuantity || 1} {it.unit || 'Pcs'}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-blue-700">{it.quantityNeeded} pcs</td>
                  <td className="py-2 px-3 text-right font-mono">Rs {(it.costPrice || 0).toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    Rs {(it.totalCost || it.quantityNeeded * (it.costPrice || 0)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Items:</span>
                <span className="font-bold">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Pieces:</span>
                <span className="font-bold font-mono">
                  {order.items.reduce((acc, i) => acc + i.quantityNeeded, 0)} pcs
                </span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="text-blue-700 font-mono">Rs {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-dashed border-slate-300 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 mb-2 h-10"></div>
              <span className="font-bold">Prepared / Authorized By</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-10"></div>
              <span className="font-bold">Vendor Delivery Agent</span>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 h-10"></div>
              <span className="font-bold">Warehouse Stock Received</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
