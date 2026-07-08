import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Activity, FileText, X, AlertTriangle } from 'lucide-react';
import type { Order } from './AdminPOSView';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import OrderPreviewModal from '../components/OrderPreviewModal';

interface DispatchHistoryProps {
  pastOrders?: Order[];
}

export default function DispatchHistory({ pastOrders = [] }: DispatchHistoryProps) {
  type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom';
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return pastOrders.filter(order => {
      const orderDate = new Date(order.date);
      if (filterPeriod === 'Today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (filterPeriod === 'Week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= oneWeekAgo && orderDate <= now;
      }
      if (filterPeriod === 'Month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'Year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'Custom') {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [pastOrders, filterPeriod, customStartDate, customEndDate]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalTransactions = filteredOrders.length;
  const avgOrderValue = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;
  const itemsSold = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  // Dynamic Chart Data
  const chartDailyData = useMemo(() => {
    if (filteredOrders.length === 0) return [];
    
    const isSingleDay = filterPeriod === 'Today' || 
      (filterPeriod === 'Custom' && customStartDate === customEndDate);

    const map = new Map<string, number>();

    filteredOrders.forEach(order => {
      const d = new Date(order.date);
      let key: string;
      if (isSingleDay) {
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        key = timeStr.split(':')[0] + ':00'; 
      } else {
        key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      map.set(key, (map.get(key) || 0) + order.total);
    });

    const arr = Array.from(map.entries()).map(([time, sales]) => ({ time, sales }));
    
    if (isSingleDay) {
      arr.sort((a, b) => a.time.localeCompare(b.time));
    } else {
      arr.sort((a, b) => new Date(a.time + ' ' + new Date().getFullYear()).getTime() - new Date(b.time + ' ' + new Date().getFullYear()).getTime());
    }
    
    return arr;
  }, [filteredOrders, filterPeriod, customStartDate, customEndDate]);

  const chartCategoryData = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.category || 'Uncategorized';
        map.set(cat, (map.get(cat) || 0) + (item.price * item.quantity));
      });
    });
    return Array.from(map.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="flex-1 bg-[#f8fafc] dark:bg-[#0a0a0c] p-4 md:p-8 overflow-y-auto custom-scrollbar h-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">Revenue & Analytics</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-[13px]">Real-time performance metrics</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-1 shadow-sm flex flex-wrap text-[13px]">
               {['Today', 'Week', 'Month', 'Year', 'Custom'].map(period => (
                 <button 
                   key={period}
                   onClick={() => setFilterPeriod(period as FilterPeriod)}
                   className={`px-3 py-1 font-semibold rounded-sm transition-colors ${filterPeriod === period ? 'bg-zinc-100 dark:bg-slate-700 text-zinc-800 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
                 >
                   {period}
                 </button>
               ))}
            </div>
            {filterPeriod === 'Custom' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-sm shadow-sm">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">From</span>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-sm shadow-sm">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">To</span>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm hover:border-zinc-300 dark:hover:border-slate-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-zinc-100 dark:bg-slate-700 text-zinc-900 dark:text-zinc-50 rounded-sm">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium">Filtered Revenue</p>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">Rs {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm hover:border-zinc-300 dark:hover:border-slate-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-zinc-100 dark:bg-slate-700 text-zinc-900 dark:text-zinc-50 rounded-sm">
                <ShoppingCart size={20} />
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium">Filtered Transactions</p>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">{totalTransactions}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm hover:border-zinc-300 dark:hover:border-slate-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-zinc-100 dark:bg-slate-700 text-zinc-900 dark:text-zinc-50 rounded-sm">
                <Activity size={20} />
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium">Average Order Value</p>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">Rs {avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm hover:border-zinc-300 dark:hover:border-slate-500 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-zinc-100 dark:bg-slate-700 text-zinc-900 dark:text-zinc-50 rounded-sm">
                <FileText size={20} />
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[13px] font-medium">Items Sold</p>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1">{itemsSold}</h3>
          </div>

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 mb-6">
          
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-6">Sales Trend</h3>
            <div className="h-[280px]">
              {chartDailyData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-zinc-400">No data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dx={-10} tickFormatter={(value) => `Rs ${value}`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', backgroundColor: 'var(--tw-bg-opacity, #fff)' }}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#18181b" strokeWidth={2} dot={{ r: 3, fill: '#18181b', strokeWidth: 1, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-6">Revenue by Category</h3>
            <div className="h-[280px]">
              {chartCategoryData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-sm font-medium text-zinc-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCategoryData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '4px', border: '1px solid #e4e4e7', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} />
                    <Bar dataKey="revenue" fill="#52525b" radius={[0, 2, 2, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

        {/* Order History Log */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-sm shadow-sm overflow-hidden mb-6">
          <div className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-5 py-4 flex items-center gap-2">
            <FileText className="text-zinc-600 dark:text-zinc-400" size={18} />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Transactions ({filterPeriod})</h2>
            <span className="ml-auto bg-zinc-200 dark:bg-zinc-900/60 backdrop-blur-md text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-sm text-[11px] font-semibold">
              {filteredOrders.length} Completed
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Receipt #</th>
                  <th className="px-5 py-3 font-semibold hidden sm:table-cell">Date & Time</th>
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Items</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-zinc-400 font-medium">
                      No transactions found for the selected time period.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr 
                      key={order.receiptNumber} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono font-semibold text-zinc-700 dark:text-zinc-300">REC-{order.receiptNumber.toString().padStart(4, '0')}</td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                        {new Date(order.date).toLocaleDateString('en-GB')} <span className="text-zinc-400 dark:text-zinc-500 ml-1">{new Date(order.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</span>
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 hidden md:table-cell">{order.items.length} items</td>
                      <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-50">Rs {order.total.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-sm text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">Completed</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Slide-over Menu for Order Details */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedOrder(null)}></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-zinc-900/60 backdrop-blur-md shadow-2xl border-l border-zinc-200 dark:border-zinc-700 z-50 transform transition-transform overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-center bg-zinc-50 dark:bg-[#0a0a0c] sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">
                REC-{selectedOrder.receiptNumber.toString().padStart(4, '0')}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Order Details</h3>
                <div className="bg-zinc-50 dark:bg-[#0a0a0c] rounded-sm border border-zinc-200 dark:border-zinc-700 p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="font-medium text-slate-800 dark:text-slate-200">{new Date(selectedOrder.date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Client</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.clientName || 'General Cash Sale'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Phone</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.client_phone || selectedOrder.contact_number || selectedOrder.contactNumber || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Booker</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.bookerName || 'Self'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Total</span><span className="font-bold text-slate-900 dark:text-slate-50">Rs {selectedOrder.total.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Actions</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setPreviewOrder(selectedOrder);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-md border-2 border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold transition-colors"
                  >
                    <FileText size={20} /> Download as PDF
                  </button>

                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Order Preview Modal */}
      {previewOrder && (
        <OrderPreviewModal
          isOpen={true}
          isDispatched={true}
          onClose={() => setPreviewOrder(null)}
          cart={previewOrder.items || []}
          total={previewOrder.total || previewOrder.total_amount || 0}
          clientName={previewOrder.clientName || previewOrder.client_name || previewOrder.shop_name || 'Walk-in'}
          paymentTerms={previewOrder.payment_terms || 'CASH'}
          draftOrderId={previewOrder.receiptNumber || previewOrder.id}
          area={previewOrder.area || 'N/A'}
          bookerName={previewOrder.bookerName || previewOrder.booker_name || 'Self'}
          contactNumber={previewOrder.contactNumber || previewOrder.client_phone || previewOrder.contact_number || 'N/A'}
          subTotal={previewOrder.subTotal || previewOrder.total || previewOrder.total_amount || 0}
        />
      )}
    </div>
  );
}
