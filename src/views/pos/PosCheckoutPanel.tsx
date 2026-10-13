import React, { useState, useRef, useEffect } from 'react';
import { Package, Printer, ShoppingBag, User, ChevronDown, MapPin, Phone, FileText, X } from 'lucide-react';
import type { CartItem, Booker } from '../../types/index';
import { formatPakistaniPhone } from '../../utils/formatPhone';

interface PosCheckoutPanelProps {
  isCheckoutSuccess: boolean;
  lastReceiptNumber: string | number;
  onPrintReceipt: () => void;
  onStartNewOrder: () => void;
  subTotal: number;
  total: number;
  clientName: string;
  setClientName: (name: string) => void;
  shops: any[];
  area: string;
  setArea: (area: string) => void;
  contactNumber: string;
  setContactNumber: (num: string) => void;
  paymentTerms: string;
  setPaymentTerms: (terms: string) => void;
  bookerName: string;
  setBookerName: (name: string) => void;
  bookersList: Booker[];
  cart: CartItem[];
}

export const PosCheckoutPanel: React.FC<PosCheckoutPanelProps> = ({
  isCheckoutSuccess,
  lastReceiptNumber,
  onPrintReceipt,
  onStartNewOrder,
  subTotal,
  total,
  clientName,
  setClientName,
  shops,
  area,
  setArea,
  contactNumber,
  setContactNumber,
  paymentTerms,
  setPaymentTerms,
  bookerName,
  setBookerName,
  bookersList,
  cart
}) => {
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showBookerDropdown, setShowBookerDropdown] = useState(false);
  const [isCustomPayment, setIsCustomPayment] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowShopDropdown(false);
      }
      if (bookerDropdownRef.current && !bookerDropdownRef.current.contains(e.target as Node)) {
        setShowBookerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c]/80">
      <div className="pb-3 border-b border-slate-200 dark:border-zinc-800/50 shrink-0 p-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-0.5">
          Checkout
        </h3>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
          Summary & Dispatch
        </h2>
      </div>

      {isCheckoutSuccess ? (
        <div className="flex flex-col flex-1 pt-8 overflow-hidden items-center text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shrink-0 shadow-sm">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1">Order Dispatched!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 px-4 font-medium">
            Receipt <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{lastReceiptNumber}</span> has been processed successfully.
          </p>

          <div className="w-full flex flex-col gap-3 mt-auto shrink-0 border-t border-slate-200 dark:border-zinc-800/50 pt-4 p-4">
            <button
              onClick={() => window.print()}
              className="w-full h-10 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-sm font-bold text-[14px] hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-[#0a0a0c] hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={16} /> Print Receipt
            </button>
            <button
              onClick={onStartNewOrder}
              className="w-full h-10 bg-slate-900 text-slate-50 rounded-sm font-semibold text-[14px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag size={16} /> Start New Order
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-1.5 mb-4 shrink-0">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 break-words max-w-[120px] text-right">
                Rs {subTotal.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-zinc-800/50 my-1.5"></div>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-slate-800 dark:text-slate-200 font-semibold text-sm">TOTAL</span>
              <span className="font-bold text-lg text-slate-900 dark:text-slate-50 tracking-tight break-words text-right">
                Rs {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 flex flex-col gap-2.5 mb-4 shrink-0 shadow-sm">
            {/* Shop / Client Name Input */}
            <div ref={dropdownRef} className={`relative ${showShopDropdown ? 'z-30' : 'z-10'}`}>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <User size={10} className="text-slate-400" /> Client / Business Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClientName(val);
                    setShowShopDropdown(true);

                    const exactShop = shops.find(
                      (s) => String(s.name || '').toLowerCase() === val.toLowerCase()
                    );
                    if (exactShop) {
                      if (!area) setArea(exactShop.address || exactShop.area || '');
                      if (!contactNumber)
                        setContactNumber(
                          exactShop.contact_number || exactShop.contactNumber || exactShop.phone || ''
                        );
                    }
                  }}
                  onFocus={() => {
                    setShowShopDropdown(true);
                    setShowBookerDropdown(false);
                  }}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 pr-8 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs"
                  placeholder="e.g. Metro Wholesale"
                />
                <ChevronDown
                  size={14}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-transform cursor-pointer ${
                    showShopDropdown ? 'rotate-180' : ''
                  }`}
                  onClick={() => setShowShopDropdown(!showShopDropdown)}
                />
              </div>

              {showShopDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md shadow-xl overflow-hidden max-h-60 overflow-y-auto z-50">
                  {shops.filter(
                    (s) =>
                      String(s.name || '').toLowerCase().includes(clientName.toLowerCase()) ||
                      String(s.contactNumber || s.contact_number || '').includes(clientName) ||
                      String(s.address || '').toLowerCase().includes(clientName.toLowerCase())
                  ).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      No shops found. Type to enter a new one.
                    </div>
                  ) : (
                    <div className="py-1">
                      {shops
                        .filter(
                          (s) =>
                            String(s.name || '').toLowerCase().includes(clientName.toLowerCase()) ||
                            String(s.contactNumber || s.contact_number || '').includes(clientName) ||
                            String(s.address || '').toLowerCase().includes(clientName.toLowerCase())
                        )
                        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                        .map((shop, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-700/50 cursor-pointer border-b border-slate-100 dark:border-zinc-700/50 last:border-0"
                            onClick={() => {
                              setClientName(shop.name);
                              setArea(shop.address || shop.area || '');
                              setContactNumber(
                                shop.contact_number || shop.contactNumber || shop.phone || ''
                              );
                              setShowShopDropdown(false);
                            }}
                          >
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">
                              {shop.name}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {(shop.address || shop.area) && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <MapPin size={10} /> {shop.address || shop.area}
                                </div>
                              )}
                              {(shop.contact_number || shop.contactNumber) && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
                                  <Phone size={10} />{' '}
                                  {formatPakistaniPhone(shop.contact_number || shop.contactNumber)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <FileText size={10} className="text-slate-400" /> Payment Terms
              </label>
              <div className="relative">
                {!isCustomPayment ? (
                  <>
                    <select
                      value={paymentTerms}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomPayment(true);
                          setPaymentTerms('');
                        } else {
                          setPaymentTerms(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 pr-8 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs appearance-none cursor-pointer"
                    >
                      <option value="Cash">Cash (Immediate)</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="30-Day Credit">30-Day Credit</option>
                      <option value="60-Day Credit">60-Day Credit</option>
                      <option value="CUSTOM" className="text-slate-400 italic">
                        Custom Payment Method...
                      </option>
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      size={14}
                    />
                  </>
                ) : (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type custom method..."
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="flex-1 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPayment(false);
                        setPaymentTerms('Bank Transfer');
                      }}
                      className="px-2 bg-slate-200 text-slate-600 rounded-sm hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Booker & Area Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div ref={bookerDropdownRef} className={`relative ${showBookerDropdown ? 'z-30' : 'z-10'}`}>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  Booker Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bookerName}
                    onChange={(e) => {
                      setBookerName(e.target.value);
                      setShowBookerDropdown(true);
                    }}
                    onFocus={() => {
                      setShowBookerDropdown(true);
                      setShowShopDropdown(false);
                    }}
                    className="w-full bg-slate-100 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 pr-8 font-medium focus:outline-none focus:border-blue-500 transition-all text-xs"
                    placeholder="e.g. Admin or Salesman"
                  />
                  <ChevronDown
                    size={14}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-transform cursor-pointer ${
                      showBookerDropdown ? 'rotate-180' : ''
                    }`}
                    onClick={() => setShowBookerDropdown(!showBookerDropdown)}
                  />
                </div>

                {showBookerDropdown && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md shadow-xl overflow-hidden max-h-60 overflow-y-auto z-50">
                    {bookersList.filter((b) => (b.name || '').toLowerCase().includes(bookerName.toLowerCase()))
                      .length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                        No bookers found. Type to enter a new one.
                      </div>
                    ) : (
                      <div className="py-1">
                        {bookersList
                          .filter((b) => (b.name || '').toLowerCase().includes(bookerName.toLowerCase()))
                          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                          .map((booker, i) => (
                            <div
                              key={i}
                              className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-700/50 cursor-pointer border-b border-slate-100 dark:border-zinc-700/50 last:border-0"
                              onClick={() => {
                                setBookerName(booker.name);
                                setShowBookerDropdown(false);
                              }}
                            >
                              <div className="font-semibold text-slate-800 dark:text-slate-200 text-[13px]">
                                {booker.name}
                              </div>
                              {booker.phone && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 whitespace-nowrap">
                                  <Phone size={10} /> {formatPakistaniPhone(booker.phone)}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  Area Name
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm py-1.5 px-2 font-medium focus:outline-none focus:border-slate-400 transition-all text-xs"
                  placeholder="e.g. Samnabad"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto shrink-0 border-t border-slate-200 dark:border-zinc-800/50 pt-3">
            <button
              onClick={onPrintReceipt}
              disabled={cart.length === 0}
              className="w-full h-10 bg-slate-900 text-slate-50 rounded-sm font-semibold text-[14px] hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={16} /> Preview & Dispatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
