import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { toWords } from 'number-to-words';

export interface ReceiptData {
  id: string;
  clientName: string;
  area: string;
  contactNumber: string;
  bookerName: string;
  createdAt: string; // ISO date or formatted
  items: {
    id: string;
    barcode?: string;
    sku?: string;
    name: string;
    quantity: number;
    price: number;
    uom?: string;
  }[];
  total: number;
}

interface ReceiptProps {
  data: ReceiptData;
  className?: string;
  isPrintable?: boolean;
}

// 20 items fit cleanly on one A4 page with header, details grid, grand total, amount in words, and signature
const ITEMS_FIRST_PAGE = 20;
const ITEMS_CONTINUATION_PAGE = 25; // Continuation pages have no header/details grid, so more room

export default function Receipt({ data, className = '', isPrintable = true }: ReceiptProps) {
  const receiptUrl = `${window.location.origin}/receipt/${data.id}`;
  // Use the order ID directly — it's already formatted as ORD-XXXXXX or B2B-XXXX
  const displayId = data.id;
  // For barcode, ensure the value isn't too long (UUIDs crash the barcode renderer)
  const barcodeValue = data.id.length > 15 ? 'ORD-' + data.id.substring(0, 6).toUpperCase() : data.id;
  const storeAddress = localStorage.getItem('shaheen_address') || 'Gulberg';
  const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Traders';
  const outletLocation = localStorage.getItem('shaheen_outlet_location') || 'Main Outlet';
  
  // Smart chunking: first page gets fewer items (has header), continuation pages get more
  const chunks: typeof data.items[] = [];
  if (data.items.length <= ITEMS_FIRST_PAGE) {
    chunks.push(data.items);
  } else {
    chunks.push(data.items.slice(0, ITEMS_FIRST_PAGE));
    let remaining = data.items.slice(ITEMS_FIRST_PAGE);
    while (remaining.length > 0) {
      chunks.push(remaining.slice(0, ITEMS_CONTINUATION_PAGE));
      remaining = remaining.slice(ITEMS_CONTINUATION_PAGE);
    }
  }
  if (chunks.length === 0) chunks.push([]); // Ensure at least 1 page renders

  // Calculate running serial number offset for each chunk
  const getSerialOffset = (pageIndex: number) => {
    if (pageIndex === 0) return 0;
    let offset = ITEMS_FIRST_PAGE;
    for (let i = 1; i < pageIndex; i++) {
      offset += chunks[i].length;
    }
    return offset;
  };

  return (
    <div id={isPrintable ? "receipt-print-area" : undefined} className={`w-full flex flex-col gap-0 ${className}`}>
      {chunks.map((chunk, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;
        const isFirstPage = pageIndex === 0;
        const pageNumber = pageIndex + 1;
        const totalPages = chunks.length;
        const serialOffset = getSerialOffset(pageIndex);

        return (
          <div 
            key={pageIndex}
            className="receipt-page bg-white text-black font-sans w-[210mm] h-[297mm] mx-auto p-[10mm] print:w-[210mm] print:h-[297mm] print:p-[10mm] print:m-0 print:break-after-page shadow-sm border border-slate-200 print:border-none print:shadow-none flex flex-col [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
            style={{ boxSizing: 'border-box', overflow: 'hidden', pageBreakAfter: 'always' }}
          >
            {/* Header — only on first page */}
            {isFirstPage && (
              <>
                {/* 1. Header (Barcode + Logo + QR Code) */}
                <div className="flex items-start justify-between mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                   <div className="flex flex-col items-start w-1/3 pt-0">
                     <Barcode 
                       value={barcodeValue} 
                       width={1.2} 
                       height={24} 
                       fontSize={12} 
                       margin={0}
                       displayValue={false}
                     />
                     <span className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold tracking-widest">{displayId}</span>
                   </div>
                   <div className="flex flex-col items-center justify-center w-1/3">
                     <img src="/logo_transparent.png" alt="Shaheen Logo" className="w-16 h-16 object-contain" />
                   </div>
                   <div className="flex flex-col items-end w-1/3 pt-0">
                     <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5">SCAN TO VERIFY</span>
                     <QRCodeSVG value={receiptUrl} size={45} />
                   </div>
                </div>

                {/* 2. Title */}
                <div className="text-center mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                  <h1 className="text-2xl font-black text-[#1a202c] tracking-wider uppercase">{storeName}</h1>
                  <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-3">
                     <span>{storeAddress}</span>
                     <span>•</span>
                     <span>{outletLocation}</span>
                     <span>•</span>
                     <span>0318 2345703</span>
                  </div>
                </div>

                {/* 3. Grid Details */}
                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11px]">
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">SHOP NAME:</span>
                         <span className="text-slate-700">{data.clientName || 'Walk-in'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">AREA:</span>
                         <span className="text-slate-700">{data.area || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">DATE OF DELIVERY:</span>
                         <span className="text-slate-700">{new Date(data.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">BOOKER NAME:</span>
                         <span className="text-slate-700">{data.bookerName || 'Self'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">CONTACT NUMBER:</span>
                         <span className="text-slate-700">{data.contactNumber || '-'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">ORDER ID:</span>
                         <span className="text-slate-700 font-mono font-bold text-xs self-center">{displayId}</span>
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Continuation page header — shows order ID and page info */}
            {!isFirstPage && (
              <div className="flex items-start justify-between mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                 <div className="flex flex-col items-start w-1/3 pt-0">
                   <Barcode 
                     value={barcodeValue} 
                     width={1.2} 
                     height={24} 
                     fontSize={12} 
                     margin={0}
                     displayValue={false}
                   />
                   <span className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold tracking-widest">{displayId}</span>
                 </div>
                 <div className="flex flex-col items-center justify-center w-1/3">
                   <img src="/logo_transparent.png" alt="Shaheen Logo" className="w-16 h-16 object-contain" />
                 </div>
                 <div className="flex flex-col items-end w-1/3 pt-0">
                   <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5">SCAN TO VERIFY</span>
                   <QRCodeSVG value={receiptUrl} size={45} />
                 </div>
              </div>
            )}

            {!isFirstPage && (
              <>
                {/* 2. Title */}
                <div className="text-center mb-1 border-b border-slate-200 pb-1 print:border-b shrink-0">
                  <h1 className="text-2xl font-black text-[#1a202c] tracking-wider uppercase">{storeName}</h1>
                  <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-3">
                     <span>{storeAddress}</span>
                     <span>•</span>
                     <span>{outletLocation}</span>
                     <span>•</span>
                     <span>0318 2345703</span>
                  </div>
                </div>

                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[11px]">
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">SHOP NAME:</span>
                         <span className="text-slate-700">{data.clientName || 'Walk-in'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">AREA:</span>
                         <span className="text-slate-700">{data.area || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">DATE OF DELIVERY:</span>
                         <span className="text-slate-700">{new Date(data.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">BOOKER NAME:</span>
                         <span className="text-slate-700">{data.bookerName || 'Self'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">CONTACT NUMBER:</span>
                         <span className="text-slate-700">{data.contactNumber || '-'}</span>
                      </div>
                      <div className="flex gap-2">
                         <span className="font-bold text-slate-900 uppercase">ORDER ID:</span>
                         <span className="text-slate-700 font-mono font-bold text-xs self-center">{displayId}</span>
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* 4. Items Table — grows to fill available space */}
            <div className="flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-t-2 border-slate-800 text-[11px]">
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-8">S.No</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[60px]">SKU</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[80px]">Prod ID</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800">Product Name</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[60px]">Quantity</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[65px]">Rate/Pcs</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[75px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const serialNo = serialOffset + idx + 1;
                    return (
                      <tr key={idx} className="border-b border-slate-400 print:break-inside-avoid text-[11px]">
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{serialNo}</td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800 font-mono text-[9px] font-bold">{item.sku || '-'}</td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800 font-mono text-[9px] truncate max-w-[80px]">{item.barcode || item.id}</td>
                        <td className="py-0 px-1 text-slate-900 font-semibold border-x-2 border-slate-800 leading-tight">{item.name}</td>
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{item.quantity} <span className="text-[9px] text-slate-600 font-normal">{item.uom || 'Pcs'}</span></td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800">{(item as any).basePrice ? (item as any).basePrice.toFixed(2) : item.price.toFixed(2)}</td>
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isLastPage && (
                <div className="flex flex-col items-end border-b-[3px] border-slate-800 pb-0.5 mt-1 print:border-b-2">
                  <div className="flex items-center gap-4 text-base mb-0.5">
                      <span className="font-bold text-slate-900 uppercase tracking-widest text-sm">GRAND TOTAL:</span>
                      <span className="font-black text-slate-900 text-base">Rs. {data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <span className="font-semibold text-slate-600 italic text-[9px] uppercase">
                      Amount in Words: {toWords(Math.floor(data.total))} Rupees Only
                  </span>
                </div>
              )}
            </div>

            {/* Footer — flows naturally after table content, pushed to bottom by flex-1 on table area */}
            <div className="shrink-0 mt-auto pt-2">
              {isLastPage ? (
                <div className="flex justify-between items-end">
                  <div className="w-56 text-center border-t-2 border-slate-800 pt-1 mt-2">
                      <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Authorized Sign</p>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 pt-1.5 uppercase tracking-widest flex flex-col items-end gap-0.5">
                      <span>PAGE {pageNumber} OF {totalPages}</span>
                      <span>Powered by Areeb Iqbal</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end border-t-2 border-slate-800 pt-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                   PAGE {pageNumber} OF {totalPages}
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
