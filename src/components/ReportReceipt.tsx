import type { Product } from '../types/index';
import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { toWords } from 'number-to-words';

export interface ReportData {
  id: string; // Used for barcode/QR
  title: string; // e.g. "Monthly Report - August"
  reportPeriod: string; // e.g. "August 2026"
  createdAt: string; 
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

interface ReportReceiptProps {
  data: ReportData;
  className?: string;
  isPrintable?: boolean;
}

// 35 items fit cleanly on one A4 page with header, details grid, grand total, amount in words, and signature
const ITEMS_FIRST_PAGE = 35;
const ITEMS_CONTINUATION_PAGE = 45; // Continuation pages have no header/details grid, so more room

export default function ReportReceipt({ data, className = '', isPrintable = true }: ReportReceiptProps) {
  const isDesktop = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
  const baseUrl = isDesktop ? 'https://shaheenglobaltraders.vercel.app' : window.location.origin;
  const receiptUrl = `${baseUrl}/report/${data.id}`;
  // Use the ID directly
  const displayId = data.id;
  // For barcode, ensure the value isn't too long
  const barcodeValue = data.id;
  const storeAddress = localStorage.getItem('shaheen_address') || 'Gulberg';
  const storeName = localStorage.getItem('shaheen_store_name') || 'Shaheen Global Traders';
  const outletLocation = localStorage.getItem('shaheen_outlet_location') || 'Main Outlet';
  const logo = localStorage.getItem('shaheen_logo');
  
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
    <div className={`receipt-container bg-transparent print:bg-white flex flex-col items-center ${isPrintable ? '' : 'py-8'} h-auto ${className}`}>
      {chunks.map((chunk, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;
        const pageNumber = pageIndex + 1;
        const totalPages = chunks.length;
        const serialOffset = getSerialOffset(pageIndex);

        return (
          <div 
            key={pageIndex}
            className="receipt-page bg-white shadow-xl print:shadow-none w-[210mm] min-h-[297mm] flex flex-col mb-8 print:mb-0 relative"
            style={{ padding: '8mm' }}
          >
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden z-0">
               <img src="/logo_transparent.png" alt="Watermark" className="w-[150mm] h-[150mm] object-contain rotate-[-15deg] grayscale mix-blend-multiply" />
            </div>

            <div className="flex-1 flex flex-col z-10">
            {/* ONLY RENDER HEADER ON FIRST PAGE */}
            {pageIndex === 0 && (
              <>
                {/* 1. Top Bar */}
                <div className="flex justify-between items-center mb-1 border-b-2 border-slate-900 pb-1 print:border-b-2 shrink-0">
                  <div className="flex flex-col items-start w-1/3 pt-1">
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
                    {logo ? (
                      <img src={logo} alt="Store Logo" className="w-[120px] h-[85px] object-contain mix-blend-multiply" />
                    ) : (
                      <img src="/logo_transparent.png" alt="Shaheen Logo" className="w-[140px] h-[85px] object-contain mix-blend-multiply" />
                    )}
                  </div>
                  <div className="flex flex-col items-end w-1/3 pt-1">
                    <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5 uppercase">Scan to Verify</span>
                    <QRCodeSVG value={receiptUrl} size={45} />
                  </div>
                </div>

                {/* 2. Title */}
                <div className="text-center mb-1 shrink-0">
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
                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0 bg-slate-100">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] px-2">
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">REPORT TYPE:</span>
                         <span className="text-slate-800 font-bold tracking-wide">{data.title}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">PERIOD:</span>
                         <span className="text-slate-800 font-bold">{data.reportPeriod}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">GENERATED ON:</span>
                         <span className="text-slate-800">{new Date(data.createdAt).toLocaleDateString('en-GB')} {new Date(data.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">REPORT ID:</span>
                         <span className="text-slate-800 font-mono font-bold text-xs">{displayId}</span>
                      </div>
                   </div>
                </div>
              </>
            )}

            {/* Continuation page header — shows order ID and page info */}
            {pageIndex !== 0 && (
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
                   <img src="/logo_transparent.png" alt="Shaheen Logo" className="w-16 h-16 object-contain mix-blend-multiply" />
                 </div>
                 <div className="flex flex-col items-end w-1/3 pt-0">
                   <span className="text-[6.5px] font-bold tracking-[0.2em] text-slate-800 mb-0.5 mr-0.5">SCAN TO VERIFY</span>
                   <QRCodeSVG value={receiptUrl} size={45} />
                 </div>
              </div>
            )}

            {pageIndex !== 0 && (
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

                <div className="border-t-2 border-b-2 border-slate-800 py-1 mb-1 print:border-t-2 print:border-b-2 shrink-0 bg-slate-100">
                   <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] px-2">
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">REPORT TYPE:</span>
                         <span className="text-slate-800 font-bold tracking-wide">{data.title}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">PERIOD:</span>
                         <span className="text-slate-800 font-bold">{data.reportPeriod}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">GENERATED ON:</span>
                         <span className="text-slate-800">{new Date(data.createdAt).toLocaleDateString('en-GB')} {new Date(data.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                         <span className="font-bold text-slate-900 uppercase">REPORT ID:</span>
                         <span className="text-slate-800 font-mono font-bold text-xs">{displayId}</span>
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
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[85px]">SKU</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[80px]">Prod ID</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800">Product Name</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[60px]">Quantity</th>
                    <th className="py-0.5 px-1 font-bold text-slate-900 border-x-2 border-slate-800 text-center w-[75px]">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const serialNo = serialOffset + idx + 1;
                    return (
                      <tr key={idx} className="border-b border-slate-400 print:break-inside-avoid text-[11px]">
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{serialNo}</td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800 font-mono text-[9px] font-bold whitespace-nowrap">{item.sku || '-'}</td>
                        <td className="py-0 px-1 text-center text-slate-800 border-x-2 border-slate-800 font-mono text-[9px] truncate max-w-[80px]">{item.barcode || item.id}</td>
                        <td className="py-0 px-1 text-slate-900 font-semibold border-x-2 border-slate-800 leading-tight">{item.name}</td>
                        <td className="py-0 px-1 text-center text-slate-900 border-x-2 border-slate-800 font-bold">{item.quantity} <span className="text-[9px] text-slate-600 font-normal">{item.uom || 'Pcs'}</span></td>
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
          </div>
        );
      })}
    </div>
  );
}
