import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Receipt, { type ReceiptData } from '../components/Receipt';
import { supabase } from '../lib/supabase';
import { ChevronLeft, Printer, FolderDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import { saveOrderBackup } from '../utils/exportManager';
import toast from 'react-hot-toast';
import { generateSKU } from './ProductsView';

export default function ReceiptView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // First check local offline orders (if scanned from same device before syncing)
        const localOrdersStr = localStorage.getItem('shaheen_orders');
        if (localOrdersStr) {
          const localOrders = JSON.parse(localOrdersStr) as any[];
          const found = localOrders.find((o) => o.id === orderId || o.receiptNumber === orderId || o.orderId === orderId);
          if (found) {
            const receiptData: ReceiptData = {
               id: found.id || found.receiptNumber || found.orderId,
               clientName: found.clientName || found.client_name,
               area: found.area,
               contactNumber: found.contactNumber || found.contact_number || '-',
               bookerName: found.bookerName || found.booker_name,
               createdAt: found.createdAt || found.date || found.timestamp || new Date().toISOString(),
               items: (found.items || []).map((i: any) => ({ ...i, sku: i.sku && i.sku !== i.barcode && i.sku.trim() !== '' ? i.sku : generateSKU(i.name || 'Product', i.barcode || '') })),
               total: found.total
            };
            document.title = receiptData.id;
            setOrder(receiptData);
            setLoading(false);
            return;
          }
        }

        // If not found locally, fetch from Supabase
        let data = null;
        try {
          const { data: sbData, error: sbError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          if (!sbError) {
            data = sbData;
          }
        } catch (e) {
          console.warn("Online fetch failed, falling back to offline check", e);
        }

        if (data) {
          const receiptData: ReceiptData = {
             id: data.id,
             clientName: data.client_name,
             area: data.area,
             contactNumber: data.client_phone || data.contact_number || '-',
             bookerName: data.booker_name,
             createdAt: data.created_at,
             items: (data.items || []).map((i: any) => ({ ...i, sku: i.sku && i.sku !== i.barcode && i.sku.trim() !== '' ? i.sku : generateSKU(i.name || 'Product', i.barcode || '') })),
             total: data.total || data.total_amount || 0
          };
          document.title = receiptData.id;
          setOrder(receiptData);
        } else {
          // Check shaheen_offline_orders
          const offlineOrdersStr = localStorage.getItem('shaheen_offline_orders');
          if (offlineOrdersStr) {
            interface OfflineOrder {
              id?: string;
              idempotency_key?: string;
              receipt_number?: string;
              client_name: string;
              area: string;
              contact_number?: string;
              booker_name: string;
              created_at: string;
              items: Array<{
                id: string;
                name: string;
                price: number;
                quantity: number;
              }>;
              total: number;
            }
            const offlineOrders = JSON.parse(offlineOrdersStr) as OfflineOrder[];
            const foundOffline = offlineOrders.find((o) => o.id === orderId || o.idempotency_key === orderId || o.receipt_number === orderId);
            if (foundOffline) {
              const receiptData: ReceiptData = {
                 id: foundOffline.id || foundOffline.receipt_number || foundOffline.idempotency_key,
                 clientName: foundOffline.client_name,
                 area: foundOffline.area,
                 contactNumber: foundOffline.client_phone || foundOffline.contact_number || '-',
                 bookerName: foundOffline.booker_name,
                 createdAt: foundOffline.created_at,
                 items: (foundOffline.items || []).map((i: any) => ({ ...i, sku: i.sku && i.sku !== i.barcode && i.sku.trim() !== '' ? i.sku : generateSKU(i.name || 'Product', i.barcode || '') })),
                 total: foundOffline.total
              };
              document.title = receiptData.id;
              setOrder(receiptData);
              setLoading(false);
              return;
            }
          }
          setError('Receipt not found');
        }
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        setError('Could not load receipt: ' + message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
         <div className="animate-pulse w-10 h-10 bg-slate-900 rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-sm w-full">
            <h1 className="text-xl font-bold text-red-600 mb-2">Receipt Error</h1>
            <p className="text-slate-600 mb-6">{error || 'Receipt could not be found.'}</p>
            <Link to="/booker" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold inline-block transition-colors">Return Home</Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Bar (Hidden when printing) */}
      <div className="print:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
         <Link to="/booker" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span className="font-semibold">Back</span>
         </Link>
           <div className="flex items-center gap-3">
             <button 
               onClick={() => window.print()}
               className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm"
             >
               <Printer size={18} /> Print
             </button>
             <button 
               onClick={async () => {
                 if (order) {
                   const details = {
                     clientName: order.clientName,
                     paymentTerms: 'Cash',
                     area: order.area,
                     contactNumber: order.contactNumber,
                     bookerName: order.bookerName,
                     total: order.total,
                   };
                   const success = await saveOrderBackup(order.id, order.items, details);
                   if (success) {
                     toast.success('SAVED TO SHAHEEN BACKUP');
                   }
                 }
               }}
               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 transition-colors shadow-sm"
             >
               <FolderDown size={18} /> Save Backup
             </button>
           </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex justify-start md:justify-center items-start print:p-0 overflow-x-auto">
         <div className="bg-white shadow-xl border border-slate-200 print:shadow-none print:border-none rounded-lg w-full max-w-[210mm] min-w-[800px] md:min-w-[210mm]">
            <Receipt data={order} />
         </div>
      </div>
    </div>
  );
}
