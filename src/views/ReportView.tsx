import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ReportReceipt from '../components/ReportReceipt';
import type { ReportData } from '../components/ReportReceipt';
import { Loader2, Printer, ChevronLeft } from 'lucide-react';

export default function ReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      if (!reportId) {
        setError('No report ID provided.');
        setLoading(false);
        return;
      }

      try {
        let startDateStr = '';
        let endDateStr = '';
        let title = '';
        let reportPeriod = '';

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        if (reportId.startsWith('MONTHLY-')) {
          const parts = reportId.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10);
            startDateStr = new Date(year, month - 1, 1).toISOString();
            endDateStr = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
            const monthName = monthNames[month - 1];
            title = `Monthly Report - ${monthName}`;
            reportPeriod = `${monthName} ${year}`;
          } else {
            throw new Error('Invalid Monthly Report ID format');
          }
        } else if (reportId.startsWith('BIYEARLY-')) {
          const parts = reportId.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[1], 10);
            const halfStr = parts[2];
            const half = halfStr === 'H1' ? 1 : halfStr === 'H2' ? 2 : 0;
            
            if (half === 1) {
              startDateStr = new Date(year, 0, 1).toISOString();
              endDateStr = new Date(year, 6, 0, 23, 59, 59, 999).toISOString();
              title = `Bi-Yearly Report - JAN-JUNE`;
              reportPeriod = `JAN-JUNE ${year}`;
            } else if (half === 2) {
              startDateStr = new Date(year, 6, 1).toISOString();
              endDateStr = new Date(year, 12, 0, 23, 59, 59, 999).toISOString();
              title = `Bi-Yearly Report - JULY-DEC`;
              reportPeriod = `JULY-DEC ${year}`;
            } else {
              throw new Error('Invalid Bi-Yearly Report ID half');
            }
          } else {
            throw new Error('Invalid Bi-Yearly Report ID format');
          }
        } else {
          throw new Error('Unknown Report Type');
        }

        const { data: orders, error: supabaseError } = await supabase
          .from('orders')
          .select('items, total')
          .eq('status', 'COMPLETED')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr);

        if (supabaseError) throw supabaseError;

        const actualOrders = orders || [];
        
        // Aggregate items
        const itemsMap = new Map<string, any>();
        
        actualOrders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const id = item.id || item.barcode || item.name;
              if (!id) return;
              
              const amount = (item.basePrice || item.price) * item.quantity;
              
              if (itemsMap.has(id)) {
                const existing = itemsMap.get(id);
                existing.quantity += item.quantity;
                existing.totalAmount += amount;
              } else {
                itemsMap.set(id, {
                  id: item.id || id,
                  barcode: item.barcode,
                  sku: item.sku,
                  name: item.name,
                  uom: item.uom,
                  quantity: item.quantity,
                  totalAmount: amount
                });
              }
            });
          }
        });

        const aggregatedItems = Array.from(itemsMap.values()).map(item => {
          return {
            ...item,
            price: item.totalAmount / item.quantity
          };
        }).sort((a, b) => b.quantity - a.quantity);

        const totalAmount = actualOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        setReportData({
          id: reportId,
          title,
          reportPeriod,
          createdAt: new Date().toISOString(),
          items: aggregatedItems,
          total: totalAmount
        });

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4 text-indigo-600 dark:text-indigo-400">
          <Loader2 className="animate-spin" size={32} />
          <p className="font-semibold">Compiling Report Data...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-lg shadow-sm text-center max-w-md">
          <p className="text-red-500 font-bold mb-4">{error || 'Report not found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-md font-semibold text-sm transition-transform active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] flex flex-col font-sans">
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 print:hidden shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium text-sm"
        >
          <ChevronLeft size={18} /> Back
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm text-sm"
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex justify-center items-start print:p-0 overflow-x-auto">
        <div className="shadow-xl print:shadow-none bg-white">
          <ReportReceipt data={reportData} isPrintable={true} />
        </div>
      </div>
    </div>
  );
}
