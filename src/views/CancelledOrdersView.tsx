import React, { useState, useMemo } from 'react';
import type { Order } from '../types';
import { Search, Calendar, History, RotateCcw } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom';

export default function CancelledOrdersView({ pastOrders, onRestore }: { pastOrders: Order[], onRestore: (order: Order) => void }) {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');

  const cancelledOrders = useMemo(() => {
    return pastOrders.filter(o => o.status === 'CANCELLED');
  }, [pastOrders]);

  const filteredOrders = useMemo(() => {
    const today = new Date();
    
    let filtered = cancelledOrders.filter(order => {
      const orderDate = new Date(order.date || order.created_at || new Date());
      
      if (filterPeriod === 'Today') {
        return orderDate.toDateString() === today.toDateString();
      }
      if (filterPeriod === 'Week') {
        return orderDate >= startOfWeek(today, { weekStartsOn: 1 });
      }
      if (filterPeriod === 'Month') {
        return orderDate >= startOfMonth(today);
      }
      if (filterPeriod === 'Year') {
        return orderDate >= startOfYear(today);
      }
      if (filterPeriod === 'Custom') {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        (o.client_name && o.client_name.toLowerCase().includes(query)) ||
        (o.receipt_number && o.receipt_number.toLowerCase().includes(query)) ||
        (o.booker_name && o.booker_name.toLowerCase().includes(query)) ||
        (o.client_phone && o.client_phone.toLowerCase().includes(query)) ||
        (o.id && o.id.toString().toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [cancelledOrders, filterPeriod, customStartDate, customEndDate, searchQuery]);

  const isRestorable = (order: Order) => {
    const cancelDate = order.cancelled_at ? new Date(order.cancelled_at) : new Date(order.date || order.created_at || new Date());
    const thirtyDaysAgo = subDays(new Date(), 30);
    return isAfter(cancelDate, thirtyDaysAgo);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]">
      <div className="px-6 py-4 flex flex-col gap-4 border-b border-slate-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <History size={18} className="text-red-500" />
             <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cancelled Orders</h2>
          </div>
          <span className="text-xs italic font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
            Cancelled Orders here can be restored within 30 days
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-md">
            {(['Today', 'Week', 'Month', 'Year', 'Custom'] as FilterPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={px-3 py-1 font-semibold rounded-sm transition-colors text-[13px] }
              >
                {period}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {filterPeriod === 'Custom' && (
              <div className="flex items-center gap-2 mr-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md dark:text-white"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md dark:text-white"
                />
              </div>
            )}
            
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search cancelled orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <History size={48} className="opacity-20 mb-4" />
             <p className="font-medium">No cancelled orders found for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div key={order.id || order.receipt_number} className="bg-white dark:bg-zinc-800 border border-red-100 dark:border-red-900/30 rounded-lg p-4 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <h3 className="font-bold text-slate-900 dark:text-slate-50">{order.client_name || 'Walk-in Customer'}</h3>
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-sm">CANCELLED</span>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                  <p>Order #{order.receipt_number || order.id}</p>
                  <p>Date: {format(new Date(order.date || order.created_at || new Date()), 'PP p')}</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Total: Rs {(order.total || 0).toLocaleString()}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (isRestorable(order)) {
                        onRestore(order);
                      } else {
                        toast.error('Cannot restore: Order was cancelled more than 30 days ago.');
                      }
                    }}
                    disabled={!isRestorable(order)}
                    className="flex-1 py-1.5 flex justify-center items-center gap-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                  >
                    <RotateCcw size={12} /> Restore Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
