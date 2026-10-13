import React from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  ChevronUp,
  ChevronDown,
  Share2,
  Printer,
  Trash2,
  Check
} from 'lucide-react';
import type { ConfirmedPurchaseOrder } from '../../../types/index';

interface ReceivedHistoryTabProps {
  historyPlacedOrders: ConfirmedPurchaseOrder[];
  activePlacedOrdersCount: number;
  expandedHistoryOrderIds: Record<string, boolean>;
  onToggleExpand: (orderId: string) => void;
  onShareWhatsApp: (order: ConfirmedPurchaseOrder) => void;
  onPrintPO: (order: ConfirmedPurchaseOrder) => void;
  onDeleteOrder: (orderId: string, orderNumber: string) => void;
  onSwitchToPlaced: () => void;
  onSwitchToDraft: () => void;
}

export const ReceivedHistoryTab: React.FC<ReceivedHistoryTabProps> = ({
  historyPlacedOrders,
  activePlacedOrdersCount,
  expandedHistoryOrderIds,
  onToggleExpand,
  onShareWhatsApp,
  onPrintPO,
  onDeleteOrder,
  onSwitchToPlaced,
  onSwitchToDraft
}) => {
  if (historyPlacedOrders.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Completed Purchase Orders in History Yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          When you receive stock from the <strong>Placed Orders (Awaiting Delivery)</strong> tab, completed orders will
          automatically appear here with their receiving history, item breakdowns, and printable vouchers.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToPlaced}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Clock size={14} /> View Placed Orders ({activePlacedOrdersCount})
          </button>
          <button
            onClick={onSwitchToDraft}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Order Draft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {historyPlacedOrders.map((order) => {
        const isExpanded = !!expandedHistoryOrderIds[order.id];
        return (
          <div
            key={order.id}
            className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden transition-all"
          >
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-zinc-800/30">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-white">Order #{order.orderNumber}</span>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    FULLY RECEIVED
                  </span>
                  {order.supplierName && (
                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Building2 size={12} className="text-blue-600" /> {order.supplierName}
                    </span>
                  )}
                  {order.paymentMethod && order.paymentMethod !== 'UNPAID' && (
                    <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                      {order.paymentMethod === 'CASH'
                        ? 'Paid: Cash Register'
                        : order.paymentMethod === 'VENDOR_CREDIT'
                        ? 'Vendor Credit Ledger'
                        : 'Bank Transfer'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Completed on {new Date(order.date).toLocaleDateString()} at{' '}
                  {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                  {order.items.length} items
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                <div className="text-right mr-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Invoiced
                  </span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-base font-mono">
                    Rs {order.totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Toggle Expand Items */}
                <button
                  onClick={() => onToggleExpand(order.id)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Inspect received items table"
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isExpanded ? 'Hide' : `Items (${order.items.length})`}
                </button>

                <button
                  onClick={() => onShareWhatsApp(order)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Share voucher via WhatsApp"
                >
                  <Share2 size={13} /> WhatsApp
                </button>

                <button
                  onClick={() => onPrintPO(order)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Print Purchase Slip"
                >
                  <Printer size={13} /> Print
                </button>

                <button
                  onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:border-red-900/50"
                  title="Delete this order from history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Expanded Items Breakdown */}
            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-800/40 text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">Item</th>
                      <th className="py-2.5 px-4 font-semibold">Barcode / SKU</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Unit Received</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Base Pieces</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Cost / Pc</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((it) => (
                      <tr
                        key={it.id}
                        className="border-b border-slate-100 dark:border-zinc-800/40 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
                      >
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span>{it.name}</span>
                            {it.isNewProduct && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300">
                                NEW PRODUCT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {it.barcode || it.sku || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {it.receivedUnitQuantity || it.unitQuantity || 1} {it.unit || 'Pcs'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                          +{it.receivedQuantityNeeded || it.quantityNeeded} pcs
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          Rs {(it.costPrice || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          Rs {(it.totalCost || it.quantityNeeded * (it.costPrice || 0)).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check size={11} strokeWidth={3} /> Received
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
