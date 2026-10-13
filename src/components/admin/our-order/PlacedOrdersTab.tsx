import React from 'react';
import {
  CheckCircle2,
  Filter,
  Building2,
  Phone,
  Share2,
  Printer,
  CheckCheck,
  Check,
  Trash2
} from 'lucide-react';
import type { ConfirmedPurchaseOrder, OurOrderItem } from '../../../types/index';

interface PlacedOrdersTabProps {
  activePlacedOrders: ConfirmedPurchaseOrder[];
  confirmedOrders: ConfirmedPurchaseOrder[];
  supplierFilter: string;
  setSupplierFilter: (val: string) => void;
  activeSuppliersInOrders: string[];
  onShareWhatsApp: (order: ConfirmedPurchaseOrder) => void;
  onPrintPO: (order: ConfirmedPurchaseOrder) => void;
  onReceiveAll: (order: ConfirmedPurchaseOrder) => void;
  onReceiveItem: (orderId: string, item: OurOrderItem) => void;
  onDeleteOrder: (orderId: string, orderNumber: string) => void;
  onSwitchToDraft: () => void;
}

export const PlacedOrdersTab: React.FC<PlacedOrdersTabProps> = ({
  activePlacedOrders,
  confirmedOrders,
  supplierFilter,
  setSupplierFilter,
  activeSuppliersInOrders,
  onShareWhatsApp,
  onPrintPO,
  onReceiveAll,
  onReceiveItem,
  onDeleteOrder,
  onSwitchToDraft
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Supplier Filter Bar */}
      {activeSuppliersInOrders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800/50 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
            <Filter size={13} /> Filter Vendor:
          </span>
          <button
            onClick={() => setSupplierFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${
              supplierFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Vendors ({confirmedOrders.filter((o) => o.status !== 'RECEIVED').length})
          </button>
          {activeSuppliersInOrders.map((sup) => {
            const count = confirmedOrders.filter((o) => o.status !== 'RECEIVED' && o.supplierName === sup).length;
            return (
              <button
                key={sup}
                onClick={() => setSupplierFilter(sup)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                  supplierFilter === sup
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Building2 size={12} /> {sup} ({count})
              </button>
            );
          })}
        </div>
      )}

      {activePlacedOrders.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-zinc-800/50 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No Orders Awaiting Delivery</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-4">
            All placed orders have been received into inventory. Create a new order draft to request stock.
          </p>
          <button
            onClick={onSwitchToDraft}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
          >
            Go to Order Draft
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activePlacedOrders.map((order) => {
            const unreceivedCount = order.items.filter((i) => i.status !== 'RECEIVED').length;
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Order Card Header */}
                <div className="bg-slate-100/70 dark:bg-zinc-800/40 p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      PO
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-slate-900 dark:text-slate-50">
                          Order #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'PARTIALLY_RECEIVED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'
                          }`}
                        >
                          {order.status === 'PARTIALLY_RECEIVED' ? 'PARTIALLY RECEIVED' : 'AWAITING DELIVERY'}
                        </span>
                        {order.supplierName && (
                          <span className="bg-slate-200/80 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Building2 size={12} className="text-blue-600 dark:text-blue-400" /> {order.supplierName}
                          </span>
                        )}
                        {order.supplierPhone && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <Phone size={11} /> {order.supplierPhone}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Placed on {new Date(order.date).toLocaleDateString()} at{' '}
                        {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {order.items.length} items
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
                    <div className="text-right mr-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Estimated Value
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-50 font-mono">
                        Rs {order.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {/* 1-Click WhatsApp Share */}
                    <button
                      onClick={() => onShareWhatsApp(order)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 font-bold text-xs rounded-lg border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Share Purchase Order details via WhatsApp to supplier"
                    >
                      <Share2 size={14} className="text-emerald-600" /> Share WhatsApp
                    </button>

                    {/* Printable PO Voucher */}
                    <button
                      onClick={() => onPrintPO(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Print Purchase Requisition slip / voucher"
                    >
                      <Printer size={14} /> Print P.O.
                    </button>

                    <button
                      onClick={() => onReceiveAll(order)}
                      disabled={unreceivedCount === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCheck size={16} /> Received All ({unreceivedCount})
                    </button>

                    {/* Cancel / Delete Order */}
                    <button
                      onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:border-red-900/50"
                      title="Cancel / Delete Purchase Order"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Items List in this Purchase Order */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-800/20 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Item</th>
                        <th className="py-2.5 px-4 font-semibold">Barcode / SKU</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Ordered Unit</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Base Pieces</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Receiving Status</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Cost / Pc</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Line Total</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => {
                        const isReceived = item.status === 'RECEIVED';
                        const isPartial = item.status === 'PARTIALLY_RECEIVED';
                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-slate-100 dark:border-zinc-800/40 ${
                              isReceived ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span>{item.name}</span>
                                {item.isNewProduct && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-300">
                                    NEW PRODUCT
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                              {item.barcode || item.sku || '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                              {item.unitQuantity || 1} {item.unit || 'Pcs'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                              {item.quantityNeeded} pcs
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isReceived ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                  <Check size={12} strokeWidth={3} /> Fully Received
                                </span>
                              ) : isPartial ? (
                                <div className="flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200">
                                    Partial: {item.receivedUnitQuantity || 0}/{item.unitQuantity || 1} {item.unit}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    ({item.receivedQuantityNeeded || 0}/{item.quantityNeeded} pcs)
                                  </span>
                                  {item.shortShippedReason && (
                                    <span className="text-[9px] text-rose-500 font-medium">
                                      {item.shortShippedReason}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400">
                                  Awaiting (0/{item.unitQuantity || 1})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                              Rs {(item.costPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              Rs {(item.totalCost || item.quantityNeeded * (item.costPrice || 0)).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isReceived ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
                                  <Check size={13} strokeWidth={3} /> Received
                                </span>
                              ) : (
                                <button
                                  onClick={() => onReceiveItem(order.id, item)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-sm transition-colors inline-flex items-center gap-1"
                                  title="Receive stock (supports partial quantities & short delivery)"
                                >
                                  <Check size={14} /> Receive {isPartial ? 'More' : ''}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
