import type { Product, Order, CartItem, Booker } from '../types/index';
import React, { useState, useMemo, useEffect } from 'react';
import { PieChart as RePieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { PieChart, TrendingUp, Package, DollarSign, FileText, X, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import OrderPreviewModal from '../components/OrderPreviewModal';

interface DashboardViewProps {
  pastOrders: Order[];
  products: Product[];
  onRestoreOrder?: (order: Order) => void;
}

type FilterPeriod = 'Today' | 'Week' | 'Month' | 'Year' | 'Custom';

export default function DashboardView({ pastOrders, products, onRestoreOrder }: DashboardViewProps) {
  
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('Today');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('shaheen_cancelled_orders') || '[]');
      const now = new Date();
      // Purge older than 30 days
      const validOrders = stored.filter((o: Order) => {
        if (!o.cancelledAt) return true;
        const cancelDate = new Date(o.cancelledAt);
        const diffDays = (now.getTime() - cancelDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      });
      if (validOrders.length !== stored.length) {
        localStorage.setItem('shaheen_cancelled_orders', JSON.stringify(validOrders));
      }
      setCancelledOrders(validOrders);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let sourceOrders = showCancelled ? cancelledOrders : pastOrders;
    
    if (showCancelled) {
      const pastKeys = new Set(
        pastOrders.flatMap(p => [
          p.receiptNumber ? String(p.receiptNumber).trim().toLowerCase() : null,
          p.receipt_number ? String(p.receipt_number).trim().toLowerCase() : null,
          p.id ? String(p.id).trim().toLowerCase() : null
        ]).filter(Boolean)
      );

      let needsCleanup = false;
      sourceOrders = sourceOrders.filter(c => {
         const k1 = c.receiptNumber ? String(c.receiptNumber).trim().toLowerCase() : null;
         const k2 = c.receipt_number ? String(c.receipt_number).trim().toLowerCase() : null;
         const k3 = c.id ? String(c.id).trim().toLowerCase() : null;
         
         if ((k1 && pastKeys.has(k1)) || (k2 && pastKeys.has(k2)) || (k3 && pastKeys.has(k3))) {
            needsCleanup = true;
            return false;
         }
         return true;
      });
      
      if (needsCleanup) {
         localStorage.setItem('shaheen_cancelled_orders', JSON.stringify(sourceOrders));
      }
    }

    return sourceOrders.filter(order => {
      const orderDate = new Date(order.date || order.created_at || order.cancelledAt || now);
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
  }, [pastOrders, showCancelled, cancelledOrders, filterPeriod, customStartDate, customEndDate]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalOrders = 0;
    let itemsSold = 0;
    const productSales: Record<string, { name: string, qty: number, revenue: number }> = {};
    const bookerSales: Record<string, number> = {};

    filteredOrders.forEach(order => {
      totalRevenue += (order.total || 0);
      totalOrders += 1;

      // Product grouping
      if (order.items) {
        order.items.forEach((item: CartItem) => {
           itemsSold += item.quantity;
           if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
           productSales[item.id].qty += item.quantity;
           productSales[item.id].revenue += item.quantity * (item.basePrice || item.price);
        });
      }

      // Booker grouping
      const booker = order.booker_name || order.bookerName || 'Direct Sale';
      bookerSales[booker] = (bookerSales[booker] || 0) + (order.total || 0);
    });

    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const topBookers = Object.entries(bookerSales)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    return { totalRevenue, totalOrders, avgOrderValue, itemsSold, topProducts, topBookers };
  }, [filteredOrders]);

  const chartDailyData = useMemo(() => {
    if (filteredOrders.length === 0) return [];
    
    const isSingleDay = filterPeriod === 'Today' || 
      (filterPeriod === 'Custom' && customStartDate === customEndDate);

    const map = new Map<string, number>();

    filteredOrders.forEach(order => {
      const d = new Date(order.date || order.created_at || order.cancelledAt || new Date());
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto custom-scrollbar overflow-x-hidden">
      <div className="p-4 md:p-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <PieChart size={28} className="text-blue-600" />
              Analytics & History
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time performance metrics</p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-1 shadow-sm flex flex-wrap text-[13px]">
               {['Today', 'Week', 'Month', 'Year', 'Custom'].map(period => (
                 <button 
                   key={period}
                   onClick={() => setFilterPeriod(period as FilterPeriod)}
                   className={`px-3 py-1 font-semibold rounded-sm transition-colors ${filterPeriod === period ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-zinc-50 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                 >
                   {period}
                 </button>
               ))}
            </div>
            {filterPeriod === 'Custom' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 px-3 py-1.5 rounded-sm shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-[13px] font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 px-3 py-1.5 rounded-sm shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-[13px] font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setShowCancelled(!showCancelled)}
              className={`px-3 py-1.5 font-semibold rounded-sm transition-colors shadow-sm text-[12px] flex items-center gap-2 ${showCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 text-slate-600 dark:text-slate-300'}`}
            >
              <AlertTriangle size={14} />
              {showCancelled ? 'Viewing Cancelled' : 'View Cancelled'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 shrink-0">
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Live Clock</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 whitespace-nowrap">
                {currentTime.toLocaleTimeString('en-US', {
                  timeZone: localStorage.getItem('shaheen_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  hour12: true
                })}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 whitespace-nowrap">Rs {stats.totalRevenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Package size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50">{stats.totalOrders}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Products</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50">{products.length}</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 shrink-0">
          
          {/* Revenue Trend */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-6 rounded-2xl lg:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-6">Revenue Trend</h3>
            <div className="h-64">
              {chartDailyData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-400">No data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `Rs ${v/1000}k`} dx={-10} />
                    <ReTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products Pie */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-6 rounded-2xl flex flex-col">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">Top 5 Products</h3>
            <div className="flex-1 min-h-[200px]">
              {stats.topProducts.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-sm font-medium text-slate-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={stats.topProducts}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="qty"
                    >
                      {stats.topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string, props: any) => [`${value} Pcs`, props.payload.name]}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
            {stats.topProducts.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {stats.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-slate-600 dark:text-slate-300 truncate">{p.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white shrink-0">{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Booker Leaderboard */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm shrink-0 mb-8">
           <div className="p-5 border-b border-slate-200 dark:border-zinc-800/50 flex items-center justify-between">
             <h3 className="font-bold text-slate-900 dark:text-slate-50">Top Bookers Leaderboard</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/90 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Rank</th>
                    <th className="px-6 py-4 font-semibold">Booker Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/50">
                  {stats.topBookers.map((b, i) => (
                    <tr key={b.name} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-400">#{i + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{b.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">Rs {b.revenue.toLocaleString('en-PK')}</td>
                    </tr>
                  ))}
                  {stats.topBookers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Order History Log */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm shrink-0 mb-12">
          <div className="border-b border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-800/50 px-5 py-4 flex items-center gap-2">
            <FileText className="text-slate-500" size={18} />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{showCancelled ? 'Cancelled Orders' : 'Transactions'}</h2>
            <span className="ml-auto bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              {filteredOrders.length} {showCancelled ? 'Cancelled' : 'Completed'}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-white dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Receipt #</th>
                  <th className="px-5 py-3 font-semibold hidden sm:table-cell">Date & Time</th>
                  <th className="px-5 py-3 font-semibold hidden md:table-cell">Items</th>
                  <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-medium">
                      No transactions found for the selected time period.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr 
                      key={order.receiptNumber || order.receipt_number || order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">REC-{(order.receiptNumber || order.receipt_number || '---').toString().padStart(4, '0')}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {new Date(order.date || order.created_at || order.cancelledAt || new Date()).toLocaleDateString('en-GB')} <span className="text-slate-400 ml-1">{new Date(order.date || order.created_at || order.cancelledAt || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">{order.items?.length || 0} items</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">Rs {order.total?.toFixed(2)}</td>
                      <td className="px-5 py-3 text-center">
                        {showCancelled ? (
                          <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-sm text-[11px] font-semibold border border-red-200 dark:border-red-800">Cancelled</span>
                        ) : (
                          <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-sm text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">Completed</span>
                        )}
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
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-zinc-900/90 backdrop-blur-md shadow-2xl border-l border-slate-200 dark:border-zinc-800 z-50 transform transition-transform overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0c] sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-mono">
                REC-{selectedOrder.receiptNumber?.toString().padStart(4, '0') || selectedOrder.receipt_number?.toString().padStart(4, '0')}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Details</h3>
                <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-800 dark:text-slate-200">{new Date(selectedOrder.date || selectedOrder.created_at || selectedOrder.cancelledAt).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.clientName || selectedOrder.client_name || 'General Cash Sale'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.client_phone || selectedOrder.contact_number || selectedOrder.contactNumber || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Booker</span><span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.bookerName || selectedOrder.booker_name || 'Self'}</span></div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-3 mt-1"><span className="text-slate-500 font-medium">Total</span><span className="font-bold text-slate-900 dark:text-slate-50 text-base">Rs {selectedOrder.total?.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</h3>
                <div className="flex flex-col gap-3">
                  {showCancelled && onRestoreOrder ? (
                    <button 
                      onClick={() => {
                        onRestoreOrder(selectedOrder);
                        setCancelledOrders(prev => {
                          const updated = prev.filter(o => {
                            if (selectedOrder.id && o.id && selectedOrder.id === o.id) return false;
                            if (selectedOrder.receipt_number && o.receipt_number && selectedOrder.receipt_number === o.receipt_number) return false;
                            if (selectedOrder.receiptNumber && o.receiptNumber && selectedOrder.receiptNumber === o.receiptNumber) return false;
                            return true;
                          });
                          localStorage.setItem('shaheen_cancelled_orders', JSON.stringify(updated));
                          return updated;
                        });
                        setSelectedOrder(null);
                      }}
                      className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-emerald-600 text-white font-semibold transition-colors hover:bg-emerald-700 shadow-sm"
                    >
                      <RotateCcw size={20} /> Restore Order
                    </button>
                  ) : null}
                  <button 
                    onClick={() => {
                      setPreviewOrder(selectedOrder);
                    }}
                    className="flex items-center justify-center gap-3 w-full p-3 rounded-xl border-2 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 font-semibold transition-colors"
                  >
                    <FileText size={20} /> Download PDF Receipt
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
