import React, { useState } from 'react';
import type { CartItem } from '../../types/index';

interface UomSelectorProps {
  item: CartItem;
  currentProduct: any;
  updateCartUom: (id: string, uom: string) => void;
}

export const UomSelector: React.FC<UomSelectorProps> = ({ item, currentProduct, updateCartUom }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pcsPerBox = item.pcsPerBox || currentProduct?.pcsPerBox;
  const boxPerCtn = item.boxPerCtn || currentProduct?.boxPerCtn;

  const options = ['Pcs'];
  if (pcsPerBox) options.push('Box');
  if (pcsPerBox && boxPerCtn) options.push('Ctn');

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 bg-transparent text-[11px] font-semibold text-slate-700 dark:text-slate-300 ml-2 mr-1 pr-1 cursor-pointer select-none border-b border-transparent hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
      >
        {item.uom || 'Pcs'} <span className="text-[8px] opacity-70">▼</span>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded shadow-lg z-50 overflow-hidden flex flex-col min-w-[60px] animate-pop origin-bottom-left">
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  updateCartUom(item.cartId, opt);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-[12px] font-semibold cursor-pointer ${
                  item.uom === opt
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
