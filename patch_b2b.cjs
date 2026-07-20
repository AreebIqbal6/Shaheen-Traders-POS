const fs = require('fs');
let c = fs.readFileSync('src/components/B2BCheckout.tsx', 'utf-8');

c = c.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect, useRef } from 'react';"
);

c = c.replace(
  "Package, MapPin, User, CreditCard, Send, Building, Phone, ChevronDown",
  "Package, MapPin, User, CreditCard, Send, Building, Phone, ChevronDown, Search"
);

c = c.replace(
  "const [isCustomPayment, setIsCustomPayment] = useState(false);",
  `const [isCustomPayment, setIsCustomPayment] = useState(false);
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
  }, []);`
);

const shopSelectJSX = `                <div className="relative" ref={dropdownRef}>
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
                              <div className="text-xs text-slate-500">{shop.address} {shop.contactNumber && \`• \${shop.contactNumber}\`}</div>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>`;

c = c.replace(/<input\s+type="text"\s+name="businessName"[\s\S]*?<\/datalist>/, shopSelectJSX);

fs.writeFileSync('src/components/B2BCheckout.tsx', c);
