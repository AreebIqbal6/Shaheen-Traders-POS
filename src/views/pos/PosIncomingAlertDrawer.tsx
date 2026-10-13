import React from 'react';
import { Package, X, MapPin, User, CreditCard, Phone } from 'lucide-react';
import { formatPakistaniPhone } from '../../utils/formatPhone';

interface PosIncomingAlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incomingOrders: any[];
  autoBackedUpOrders: string[];
  onViewOrderDetails: (order: any) => void;
  onAcknowledgeOrder: (order: any) => void;
  onAcceptOrder: (order: any) => void;
  onCancelIncomingOrder: (order: any) => void;
}

export const PosIncomingAlertDrawer: React.FC<PosIncomingAlertDrawerProps> = ({
  isOpen,
  onClose,
  incomingOrders,
  autoBackedUpOrders,
  onViewOrderDetails,
  onAcknowledgeOrder,
  onAcceptOrder,
  onCancelIncomingOrder
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex print:hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="w-[400px] h-full bg-white dark:bg-zinc-900/60 backdrop-blur-md shadow-2xl relative z-10 flex flex-col border-r border-slate-200 dark:border-zinc-800/50 animate-in slide-in-from-left duration-300">
        <div className="px-6 py-6 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0c]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg">
              <Package size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">Incoming B2B Orders</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {incomingOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-[15px] font-medium text-center">No new incoming orders right now.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {incomingOrders.map((order, idx) => (
                <div
                  key={order.id || idx}
                  className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110 pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                      {order.client_name || 'B2B Client'}
                    </span>
                    <div className="flex gap-2">
                      {autoBackedUpOrders.includes((order.id || order.receipt_number)?.toString()) && (
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          PC BACKED UP
                        </span>
                      )}
                      <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">NEW</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> Area: {order.area || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User size={12} /> Booker: {order.booker_name || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} /> Terms: {order.payment_terms || 'Cash'}
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Phone size={12} /> Phone:{' '}
                      {order.client_phone || order.contact_number || order.contactNumber
                        ? formatPakistaniPhone(order.client_phone || order.contact_number || order.contactNumber)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-zinc-800/50 pt-3 relative z-10">
                    <span className="text-slate-800 dark:text-slate-200 font-bold text-lg">
                      Rs {(order.total || 0).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => onViewOrderDetails(order)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onAcknowledgeOrder(order)}
                            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            Order Received
                          </button>
                          <button
                            onClick={() => onCancelIncomingOrder(order)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onViewOrderDetails(order)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onAcceptOrder(order)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            Auto Make
                          </button>
                          <button
                            onClick={() => onCancelIncomingOrder(order)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs rounded-md shadow-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
