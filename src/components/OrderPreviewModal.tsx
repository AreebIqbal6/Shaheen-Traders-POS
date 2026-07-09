import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../views/ProductsView';
import Receipt from './Receipt';
import { FolderDown, Globe, Printer, X, Check, Download } from 'lucide-react';
import { saveOrderBackup } from '../utils/exportManager';
import toast from 'react-hot-toast';

interface CartItem extends Product {
  cartId: string;
  quantity: number;
  uom?: string;
}

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch?: () => Promise<boolean | void> | void;
  onBackupSuccess?: () => void;
  cart: CartItem[];
  total: number;
  subTotal: number;
  clientName: string;
  paymentTerms: string;
  area?: string;
  bookerName?: string;
  contactNumber?: string;
  draftOrderId: string;
  isSubmitting?: boolean;
  isDispatched?: boolean;
}

export default function OrderPreviewModal({
  isOpen,
  onClose,
  onDispatch,
  onBackupSuccess,
  cart,
  total,
  subTotal,
  clientName,
  paymentTerms,
  area,
  bookerName,
  contactNumber,
  draftOrderId,
  isSubmitting,
  isDispatched
}: OrderPreviewModalProps) {
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const submitting = isSubmitting || isLocalSubmitting;

  useEffect(() => {
    if (isOpen) {
      const originalTitle = document.title;
      document.title = draftOrderId;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [isOpen, draftOrderId]);

  if (!isOpen) return null;

  const isAdmin = window.location.pathname.startsWith('/admin');
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-[900px] max-w-full rounded-sm shadow-2xl flex flex-col max-h-[85vh] border border-zinc-200 dark:border-zinc-700 relative" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-sm bg-red-100 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600 transition-colors shadow-sm"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        
        {/* Invoice Content (Preview) */}
        <div className="flex-1 overflow-hidden text-black bg-slate-100 dark:bg-zinc-900 font-sans">
          <div className="w-full h-full overflow-auto custom-scrollbar hide-horizontal-scrollbar p-4 md:p-8">
            <div className="flex justify-center w-full mx-auto pb-8">
             <Receipt 
               isPrintable={true}
               data={{
                 id: draftOrderId,
                 clientName: clientName || 'General Cash Sale',
                 area: area || 'Samnabad',
                 contactNumber: contactNumber || '-',
                 bookerName: bookerName || 'Irfan',
                 createdAt: new Date().toISOString(),
                 items: cart,
                 total: total
               }} 
             />
            </div>
         </div>
        </div>
        
        {/* Action Bar */}
        <div className="bg-zinc-100 border-t border-zinc-200 dark:border-zinc-700 p-4 flex flex-col sm:flex-row justify-end gap-3 rounded-b-sm print:hidden">
           {isDispatched ? (
             <>

                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2.5 rounded-sm font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                   <Printer size={18} />
                   Print Receipt
                 </button>
                  <button 
                    onClick={async () => {
                      // Bypass browser print dialog completely and force a perfect jsPDF download
                      import('../utils/exportPdf').then(async m => {
                        const result = await m.exportReceiptToPDF(draftOrderId, false);
                        if (result) {
                          try {
                            if ('__TAURI__' in window) {
                              const { BaseDirectory } = await import('@tauri-apps/api/path');
                              const { writeBinaryFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
                              
                              const date = new Date();
                              const dateFolder = `Shaheen Receipts/${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                              
                              if (!(await exists('Shaheen Receipts', { baseDir: BaseDirectory.Document }))) {
                                await mkdir('Shaheen Receipts', { baseDir: BaseDirectory.Document });
                              }
                              
                              if (!(await exists(dateFolder, { baseDir: BaseDirectory.Document }))) {
                                await mkdir(dateFolder, { baseDir: BaseDirectory.Document });
                              }
                              
                              const filePath = `${dateFolder}/${result.filename}`;
                              const arrayBuffer = await result.blob.arrayBuffer();
                              const buffer = new Uint8Array(arrayBuffer);
                              
                              await writeBinaryFile(filePath, buffer, { baseDir: BaseDirectory.Document });
                              toast.success(`Saved to Documents/${dateFolder}`);
                            }
                            // @ts-ignore
                            else if (typeof window !== 'undefined' && window.require) {
                              // @ts-ignore
                              const fs = window.require('fs');
                              // @ts-ignore
                              const path = window.require('path');
                              // @ts-ignore
                              const os = window.require('os');
                              
                              const date = new Date();
                              const dateFolder = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                              const baseDir = path.join(os.homedir(), 'Documents', 'Shaheen Receipts');
                              const fullDir = path.join(baseDir, dateFolder);
                              
                              if (!fs.existsSync(fullDir)) {
                                fs.mkdirSync(fullDir, { recursive: true });
                              }
                              
                              const filePath = path.join(fullDir, result.filename);
                              const arrayBuffer = await result.blob.arrayBuffer();
                              const buffer = new Uint8Array(arrayBuffer);
                              
                              fs.writeFileSync(filePath, buffer);
                              import('react-hot-toast').then(t => t.default.success(`Saved securely to Documents/Shaheen Receipts/${dateFolder}`));
                            } else {
                              const { saveAs } = await import('file-saver');
                              saveAs(result.blob, result.filename);
                            }
                          } catch (e) {
                            console.error('FS Write Error:', e);
                            const { saveAs } = await import('file-saver');
                            saveAs(result.blob, result.filename);
                          }
                        }
                      });
                    }}
                    className="px-4 py-2.5 rounded-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                   <Download size={18} />
                   Download PDF
                 </button>


             </>
           ) : (
             <>

               
               {isAdmin && (
                 <button 
                   onClick={() => window.print()}
                   className="px-4 py-2.5 rounded-sm font-semibold text-zinc-700 bg-white dark:bg-slate-800 border border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                 >
                   <Printer size={18} />
                   Print
                 </button>
               )}

               <button 
                onClick={async () => {
                  const { exportReceiptToPDF } = await import('../utils/exportPdf');
                  await exportReceiptToPDF(draftOrderId, true);
                }}
                className="px-4 py-2.5 rounded-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={18} />
                Download PDF
              </button>

               {onDispatch && (
                 <button 
                   onClick={async () => {
                     setIsLocalSubmitting(true);
                     let backupSuccess = true;
                     if (isAdmin) {
                       const details = { clientName, paymentTerms, area, bookerName, contactNumber, total, subTotal };
                       backupSuccess = await saveOrderBackup(draftOrderId, cart, details);
                     }
                     
                     if (onDispatch) {
                        const dispatchResult = await onDispatch();
                        
                        if (dispatchResult !== false && backupSuccess) {
                           toast.success('Order has been saved and is completed successfully');
                           if (onBackupSuccess) onBackupSuccess();
                        } else if (dispatchResult !== false && !backupSuccess) {
                           // Dispatch worked but local file backup failed (rare edge case on desktop)
                           toast.success('Order completed (Local backup file failed)');
                           if (onBackupSuccess) onBackupSuccess();
                        }
                     }
                     setIsLocalSubmitting(false);
                   }}
                   disabled={submitting}
                   className="px-4 py-2.5 rounded-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Check size={18} />
                   Complete Order
                 </button>
               )}
             </>
           )}
        </div>
      </div>

      {/* DEDICATED PRINT COMPONENT (Portaled directly to body to escape all CSS layout contexts) */}
      {createPortal(
        <div className="absolute top-0 -left-[9999px] opacity-0 print:opacity-100 print:left-0 w-full m-0 p-0 text-black bg-white z-[999999]">
          <Receipt 
            isPrintable={true}
            data={{
              id: draftOrderId,
              clientName: clientName || 'General Cash Sale',
              area: area || 'Samnabad',
              contactNumber: contactNumber || '-',
              bookerName: bookerName || 'Irfan',
              createdAt: new Date().toISOString(),
              items: cart,
              total: total
            }} 
          />
        </div>,
        document.body
      )}
    </div>
  );
}
