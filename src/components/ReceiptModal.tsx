import React from 'react';
import Barcode from 'react-barcode';
import type { Product } from '../views/ProductsView';

interface CartItem extends Product {
  cartId: string;
  quantity: number;
  uom?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  clientName: string;
  paymentTerms: string;
  receiptNumber: number;
}

export default function ReceiptModal({ isOpen, onClose, cart, total, clientName, paymentTerms, receiptNumber }: ReceiptModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!isOpen) return null;

  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const calculateItemPrice = (item: CartItem) => {
    return item.price * item.quantity;
  };

  const handlePrintAndDispatch = async () => {
    setIsProcessing(true);
    try {
      // Trigger the browser's native print dialog
      window.print();
    } catch (e) {
      console.error("Print Failed:", e);
    } finally {
      setIsProcessing(false);
      onClose(); // Close modal and clear React state
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:block print:p-0 print:bg-white dark:bg-slate-800 print:backdrop-blur-none print:static" onClick={onClose}>
      
      {/* Container - A4 style */}
      <div 
        id="receipt-print-area"
        className="bg-white dark:bg-slate-800 w-[800px] max-w-full rounded-sm shadow-xl flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full print:h-auto print:rounded-none border border-zinc-200 dark:border-zinc-700 print:border-none print:m-0 print:block"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-12 text-black print:overflow-visible print:p-8 print:block custom-scrollbar">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-10 print:mb-6">
            <div>
              <h1 className="text-3xl mb-1 font-black text-slate-900 dark:text-slate-50 uppercase tracking-widest">{localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">B2B Wholesale Distributor</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{localStorage.getItem('shaheen_address') || 'Gulberg'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">NTN: 893247-9</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-light text-slate-300 uppercase tracking-widest mb-2">Invoice</h2>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">INV-{receiptNumber}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8 print:mb-6">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{clientName}</p>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Terms:</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{paymentTerms}</p>
             </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-10 print:mb-6">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                <th className="py-3 px-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Item Description</th>
                <th className="py-3 px-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">UOM</th>
                <th className="py-3 px-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">Qty</th>
                <th className="py-3 px-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Rate</th>
                <th className="py-3 px-2 text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-4 px-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                    {item.barcode && <p className="text-xs text-slate-400 font-mono mt-0.5">{item.barcode}</p>}
                  </td>
                  <td className="py-4 px-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">{item.uom || 'Pcs'}</td>
                  <td className="py-4 px-2 text-center text-sm font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-sm font-medium text-slate-600 dark:text-slate-400">Rs {item.price.toFixed(2)}</td>
                  <td className="py-4 px-2 text-right text-sm font-bold text-slate-800 dark:text-slate-200">Rs {calculateItemPrice(item).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-16 print:mb-6 print:break-inside-avoid">
            <div className="w-72">
               <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Rs {(total / 1.1).toFixed(2)}</span>
               </div>
               <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tax (10%)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Rs {(total - (total / 1.1)).toFixed(2)}</span>
               </div>
               <div className="flex justify-between py-4 border-b-2 border-slate-900 mt-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50 uppercase">Total Due</span>
                  <span className="text-xl font-black text-slate-900 dark:text-slate-50">Rs {total.toFixed(2)}</span>
               </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-auto pt-20 print:pt-8 print:mt-8 print:break-inside-avoid">
             <div className="w-64 text-center border-t border-slate-400 pt-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Authorized Signatory</p>
             </div>
             <div className="w-64 text-center border-t border-slate-400 pt-2 flex flex-col items-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivery Driver</p>
             </div>
          </div>

          {/* Barcode Footer */}
          <div className="flex flex-col items-center justify-center mt-12 print:mt-4 print:break-inside-avoid">
            <Barcode 
              value={`INV-${receiptNumber}`} 
              width={1.5} 
              height={40} 
              displayValue={false} 
              margin={0} 
              background="transparent" 
            />
            <p className="mt-1 text-xs font-mono font-medium tracking-[0.2em] text-zinc-800 dark:text-zinc-200">
              INV-{receiptNumber}
            </p>
          </div>

        </div>

        {/* Modal Controls (Hidden during print) */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3 shrink-0 print:hidden">
           <button 
             onClick={onClose}
             disabled={isProcessing}
             className="px-5 py-2.5 text-zinc-600 font-sans font-semibold hover:bg-zinc-200 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
           >
             Cancel
           </button>
           <button 
             onClick={handlePrintAndDispatch}
             disabled={isProcessing}
             className="px-6 py-2.5 bg-zinc-900 text-zinc-50 font-sans font-semibold hover:bg-zinc-800 rounded-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isProcessing ? 'Printing...' : 'Print & Dispatch'}
           </button>
        </div>

      </div>
    </div>
    </>
  );
}
