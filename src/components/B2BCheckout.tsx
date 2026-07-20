import type { Order, CartItem, Booker } from '../types/index';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Package, MapPin, User, CreditCard, Send, Building, Phone, ChevronDown, Search } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  basePrice?: number;
  quantity: number;
  uom?: string;
  barcode?: string;
  sku?: string;
}

interface B2BCheckoutProps {
  cart: CartItem[];
  total: number;
  onSuccess: () => void;
  onBack: () => void;
}

export default function B2BCheckout({ cart, total, onSuccess, onBack }: B2BCheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [shopSearch, setShopSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShopDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [shops, setShops] = useState<any[]>(() => {
    const saved = localStorage.getItem('shaheen_shops');
    return saved ? JSON.parse(saved) : [];
  });

  const activeBooker = JSON.parse(localStorage.getItem('shaheen_active_booker') || '{}');
  const [formData, setFormData] = useState({
    businessName: '',
    areaName: '',
    bookerName: activeBooker.name || '',
    contactNumber: '',
    paymentTerms: 'Cash on Delivery'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Manual validation to prevent silent HTML5 validation failures on mobile
    if (!formData.businessName || !formData.areaName || !formData.bookerName || !formData.contactNumber) {
      setError('Please fill out all required fields.');
      setIsSubmitting(false);
      return;
    }

    const validatePhone = (phone: string) => {
      const cleanPhone = phone.replace(/[\s-]/g, '');
      return /^((\+92)|(92))?3\d{9}$|^03\d{9}$/.test(cleanPhone);
    };

    if (!validatePhone(formData.contactNumber)) {
      setError('Please enter a valid Pakistani phone number (e.g. 0300 1234567).');
      setIsSubmitting(false);
      return;
    }

    const orderPayload = {
      client_name: formData.businessName,
      area: formData.areaName,
      booker_name: formData.bookerName,
      contact_number: formData.contactNumber,
      payment_terms: formData.paymentTerms,
      items: cart,
      total: total,
      status: 'PENDING', // Updated from PENDING_APPROVAL per new 3-phase system
      source: 'BOOKER_APP',
      b2b_user_id: activeBooker.id || null,
      idempotency_key: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'ord-' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      receipt_number: 'ORD-' + Math.floor(100000 + Math.random() * 900000).toString(),
      created_at: new Date().toISOString()
    };

    try {
      if (!navigator.onLine) {
        throw new Error('Offline');
      }

      // Remove extra fields that are likely missing from the Supabase schema
      const { 
        contact_number, 
        b2b_user_id, 
        idempotency_key, 
        source, 
        receipt_number,
        payment_terms,
        ...supabasePayload 
      } = orderPayload;

      const finalPayload = {
        ...supabasePayload,
        idempotency_key: idempotency_key,
        receipt_number: receipt_number,
        client_phone: contact_number,
        area: orderPayload.area,
        booker_name: orderPayload.booker_name,
        payment_terms: orderPayload.payment_terms,
        b2b_user_id: b2b_user_id
      };

      const { error: submitError } = await supabase.from('orders').insert(finalPayload);

      if (submitError) throw submitError;

      onSuccess();
    } catch (err: unknown) {
      // If offline or network error, push to offline queue
      console.warn('Network error, saving to offline queue:', err);
      const queue = JSON.parse(localStorage.getItem('shaheen_offline_orders') || '[]');
      queue.push(orderPayload);
      localStorage.setItem('shaheen_offline_orders', JSON.stringify(queue));
      
      // Still trigger success so the user is unblocked
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative pb-20 text-slate-900 dark:text-slate-50">
      <div className="bg-white dark:bg-slate-800 p-4 shrink-0 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-200 dark:border-slate-700">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">Checkout</h1>
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{cart.length} items • Rs {total.toFixed(2)}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
           <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">Delivery Details</h2>
           
           <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Building size={12} className="text-blue-600 dark:text-blue-400" /> Business / Shop Name
                </label>
                                <div className="relative" ref={dropdownRef}>
                  <div 
                    onClick={() => setShowShopDropdown(true)}
                    className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 flex items-center justify-between text-[14px] text-slate-900 dark:text-slate-50 cursor-pointer"
                  >
                    <span>{formData.businessName || 'Select or type a shop...'}</span>
                    <Search size={16} className="text-slate-400" />
                  </div>
                  
                  {showShopDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-64 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search shop by name..."
                          value={shopSearch}
                          onChange={e => {
                             setShopSearch(e.target.value);
                             setFormData({...formData, businessName: e.target.value});
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="overflow-y-auto">
                        {shops
                          .filter(s => s.name.toLowerCase().includes(shopSearch.toLowerCase()))
                          .map((shop, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  businessName: shop.name,
                                  areaName: shop.address || '',
                                  contactNumber: shop.contactNumber || ''
                                });
                                setShopSearch('');
                                setShowShopDropdown(false);
                              }}
                              className="px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                            >
                              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{shop.name}</div>
                              <div className="text-xs text-slate-500">{shop.address} {shop.contactNumber && `• ${shop.contactNumber}`}</div>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} className="text-blue-600 dark:text-blue-400" /> Area Name
                </label>
                <input 
                  type="text" 
                  value={formData.areaName}
                  onChange={e => setFormData({...formData, areaName: e.target.value})}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="e.g. Samnabad"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <User size={12} className="text-blue-600 dark:text-blue-400" /> Booker / Contact Name
                </label>
                <input 
                  type="text" 
                  value={formData.bookerName}
                  disabled={true}
                  className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none transition-all text-sm opacity-70 cursor-not-allowed"
                  placeholder="Booker Name"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <Phone size={12} className="text-blue-600 dark:text-blue-400" /> Contact Number
                </label>
                <input 
                  type="text" 
                  value={formData.contactNumber}
                  onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="e.g. 0300 1234567"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                  <CreditCard size={12} className="text-blue-600 dark:text-blue-400" /> Payment Terms
                </label>
                  <div className="relative">
                    {!isCustomPayment ? (
                      <>
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomPayment(true);
                              setFormData({...formData, paymentTerms: ''});
                            } else {
                              setFormData({...formData, paymentTerms: e.target.value});
                            }
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 pr-8 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                        >
                          <option value="Cash on Delivery">Cash on Delivery</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="30-Day Credit">30-Day Credit</option>
                          <option value="CUSTOM" className="text-slate-400 italic">Custom Payment Method...</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Type custom method..."
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                          className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomPayment(false);
                            setFormData({...formData, paymentTerms: 'Cash on Delivery'});
                          }}
                          className="px-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center shrink-0"
                        >
                           <span className="font-bold text-xs uppercase tracking-wider">Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
              </div>
           </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-200 dark:border-slate-700 rounded-xl p-5">
           <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-3 tracking-tight">Order Summary</h2>
           <div className="flex flex-col gap-2 mb-3">
             {cart.map(item => (
               <div key={item.id} className="flex justify-between text-sm">
                 <span className="text-slate-400 font-medium truncate pr-4">{item.quantity} {item.uom || 'Pcs'} {item.name}</span>
                 <span className="text-slate-900 dark:text-slate-50 font-mono font-semibold shrink-0">Rs {(item.quantity * item.price).toFixed(2)}</span>
               </div>
             ))}
           </div>
           <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center mt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total</span>
              <span className="font-black font-mono text-lg text-blue-600 dark:text-blue-400">Rs {total.toFixed(2)}</span>
           </div>
        </div>
      </div>

      <div className="fixed bottom-[74px] left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-20 flex flex-col gap-3 shadow-none">
         {error && (
           <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-sm text-sm font-medium border border-red-200 text-center shadow-sm">
             {error}
           </div>
         )}
         <div className="flex gap-3">
           <button 
             type="button"
           onClick={onBack}
           disabled={isSubmitting}
           className="px-6 py-2.5 rounded-lg font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-[14px] shadow-none"
         >
           Back
         </button>
           <button 
             type="submit"
             form="checkout-form"
             disabled={isSubmitting}
             className="flex-1 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-none disabled:opacity-50 text-[14px]"
           >
             {isSubmitting ? 'Submitting...' : 'Submit Order'}
             {!isSubmitting && <Send size={16} />}
           </button>
         </div>
      </div>
    </div>
  );
}

// Add the Building icon since it was used
// We'll import it correctly inside the file above
