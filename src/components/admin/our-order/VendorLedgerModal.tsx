import React, { useMemo } from 'react';
import { Wallet, X, CheckCircle2, Building2 } from 'lucide-react';
import type { VendorLedgerEntry } from '../../../types/index';

interface VendorLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorLedgers: VendorLedgerEntry[];
  onSettleBill: (billId: string, payFromCash: boolean) => void;
}

export const VendorLedgerModal: React.FC<VendorLedgerModalProps> = ({
  isOpen,
  onClose,
  vendorLedgers,
  onSettleBill
}) => {
  const totalVendorPayables = useMemo(() => {
    return vendorLedgers.reduce((acc, b) => acc + (b.amount || 0), 0);
  }, [vendorLedgers]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vendor Accounts Payable Ledger</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track unpaid supplier invoices and credit deliveries.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-800/30 flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Outstanding Vendor Payables
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              Rs {totalVendorPayables.toLocaleString()}
            </span>
          </div>
          <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            {vendorLedgers.length} Unpaid Bills
          </span>
        </div>

        {/* Ledger Bills List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {vendorLedgers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No Outstanding Vendor Payables</p>
              <p className="text-xs mt-1">All supplier credit bills have been settled.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {vendorLedgers.map((bill) => (
                <div
                  key={bill.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 size={14} className="text-blue-600" /> {bill.vendorName}
                      </span>
                      <span className="text-xs font-mono font-semibold bg-slate-100 dark:bg-zinc-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        PO #{bill.orderNumber}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                      Bill recorded on {new Date(bill.date).toLocaleDateString()} at{' '}
                      {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {bill.notes && ` • ${bill.notes}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                      Rs {bill.amount.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSettleBill(bill.id, true)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                        title="Pay from register cash drawer"
                      >
                        Pay Cash
                      </button>
                      <button
                        onClick={() => onSettleBill(bill.id, false)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-colors"
                        title="Mark as paid / settled externally"
                      >
                        Mark Settled
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 flex justify-end bg-slate-50 dark:bg-zinc-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
