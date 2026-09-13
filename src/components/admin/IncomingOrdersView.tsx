import React, { useState } from 'react';
import { Package, MapPin, User, CreditCard, Phone } from 'lucide-react';
import type { Order, CartItem } from '../../types/index';

const CancelledOrdersView = React.lazy(() => import('../../views/CancelledOrdersView'));

interface IncomingOrdersViewProps {
  incomingOrders: any[];
  pastOrders: Order[];
  autoBackedUpOrders: string[];
  handleRestoreOrder: (order: Order) => void;
  handleAcknowledgeOrder: (order: any) => void;
  handleAcceptOrder: (order: any) => void;
  handleCancelIncomingOrder: (order: any) => void;
  setViewOrderDetails: (order: any) => void;
}

export default function IncomingOrdersView({
  incomingOrders,
  pastOrders,
  autoBackedUpOrders,
  handleRestoreOrder,
  handleAcknowledgeOrder,
  handleAcceptOrder,
  handleCancelIncomingOrder,
  setViewOrderDetails
}: IncomingOrdersViewProps) {
  const [activeOrdersTab, setActiveOrdersTab] = useState<'incoming' | 'cancelled'>('incoming');

  const aggregatedItems = incomingOrders.reduce((acc, order) => {
    (order.items || []).forEach((item: CartItem) => {
      const key = item.name;
      if (!acc[key]) acc[key] = 0;
      acc[key] += item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const aggregatedList = Object.entries(aggregatedItems).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]">
      <div className="bg-white dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/50 px-6 py-4 shrink-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Incoming B2B Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Review and accept orders directly into POS.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveOrdersTab('incoming')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center transition-all ${activeOrdersTab === 'incoming' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Incoming Orders {incomingOrders.length > 0 && <span className="ml-1.5 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{incomingOrders.length}</span>}
          </button>
          <button
            onClick={() => setActiveOrdersTab('cancelled')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeOrdersTab === 'cancelled' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            Cancelled Orders
          </button>
        </div>
      </div>

      {activeOrdersTab === 'cancelled' ? (
        <React.Suspense fallback={<div className="p-8">Loading...</div>}>
          <CancelledOrdersView pastOrders={pastOrders} onRestore={handleRestoreOrder} />
        </React.Suspense>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {incomingOrders.length > 0 && (
            <div className="max-w-3xl mx-auto w-full mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                 <Package size={18} className="text-blue-500" /> Inventory Pick List
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Time-saving aggregated list of all items across {incomingOrders.length} pending orders.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {aggregatedList.map(([name, qty], idx) => (
                   <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-md border border-slate-100 dark:border-slate-700/50">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{name}</span>
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded-sm">{qty}x</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            {incomingOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-[15px] font-medium text-center">No new incoming orders right now.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {incomingOrders.map((order, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-zinc-800/50 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-0.5 active:scale-[0.98]">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110 pointer-events-none"></div>
                     <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">{order.client_name || 'B2B Client'}</span>
                        <div className="flex gap-2">
                          {autoBackedUpOrders.includes((order.id || order.receipt_number)?.toString()) && (
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              PC BACKED UP
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">
                            NEW
                          </span>
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                        <span className="flex items-center gap-1"><MapPin size={12} /> Area: {order.area || 'N/A'}</span>
                        <span className="flex items-center gap-1"><User size={12} /> Booker: {order.booker_name || 'N/A'}</span>
                        <span className="flex items-center gap-1"><CreditCard size={12} /> Terms: {order.payment_terms || 'Cash'}</span>
                         <span className="flex items-center gap-1"><Phone size={12} /> Phone: {order.client_phone || order.contact_number || order.contactNumber || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between items-center border-t border-blue-100/50 dark:border-zinc-800/50 pt-3 relative z-10">
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-lg">Rs {(order.total || 0).toLocaleString()}</span>
                        <div className="flex gap-2">
                          {order.status === 'PENDING' ? (
                            <>
                              <button 
                                onClick={() => setViewOrderDetails(order)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleAcknowledgeOrder(order)}
                                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                              >
                                Order Received
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => setViewOrderDetails(order)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-md shadow-sm transition-colors"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleAcceptOrder(order)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
                              >
                                Auto Make
                              </button>
                              <button 
                                onClick={() => handleCancelIncomingOrder(order)}
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
      )}
    </div>
  );
}
