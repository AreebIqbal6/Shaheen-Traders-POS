import React from 'react';
import { ShoppingBag, AlertTriangle, Trash2 } from 'lucide-react';
import type { CartItem, Product } from '../../types/index';
import FitText from '../../components/FitText';

interface PosCartPanelProps {
  cart: CartItem[];
  products: Product[];
  unhandledOutOfStockItems: CartItem[];
  scrollToFirstOutOfStock: () => void;
  handleClearAll: () => void;
  isCheckoutSuccess: boolean;
  removeFromCart: (cartId: string) => void;
  updateCartItem: (cartId: string, updates: Partial<CartItem>) => void;
  calculateItemPrice: (item: CartItem) => number;
  onAddToOurOrder: (product: Product | CartItem, deficit: number) => void;
}

export const PosCartPanel: React.FC<PosCartPanelProps> = ({
  cart,
  products,
  unhandledOutOfStockItems,
  scrollToFirstOutOfStock,
  handleClearAll,
  isCheckoutSuccess,
  removeFromCart,
  updateCartItem,
  calculateItemPrice,
  onAddToOurOrder
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900/60 backdrop-blur-md">
      <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex justify-between items-center bg-slate-50 dark:bg-[#0a0a0c]/50 shrink-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Cart Items</h2>
        <div className="flex items-center gap-2">
          {unhandledOutOfStockItems.length > 0 && (
            <button
              onClick={scrollToFirstOutOfStock}
              className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-sm text-xs font-bold border border-red-200 dark:border-red-900/50 hover:bg-red-200 transition-colors"
              title="View out of stock items"
            >
              <AlertTriangle size={12} />
              {unhandledOutOfStockItems.length}
            </button>
          )}
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-sm text-xs font-bold border border-slate-200 dark:border-zinc-800/50">
            {cart.length} units
          </span>
          {cart.length > 0 && !isCheckoutSuccess && (
            <button
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:bg-red-900/30 p-1 rounded-sm transition-colors"
              title="Clear All"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-[#0a0a0c]/30 relative">
        {cart.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4 p-8">
            <ShoppingBag size={48} className="opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-center">Scan or select items</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.map((item, idx) => {
              const currentProduct = products.find((p) => p.id === item.id);
              const stockAvailable = currentProduct?.stock || 0;
              const deficit = item.quantity - stockAvailable;
              const isOutOfStock = deficit > 0;

              const itemPcsPerBox =
                item.pcsPerBox ||
                (item as any).pcs_per_box ||
                currentProduct?.pcsPerBox ||
                (currentProduct as any)?.pcs_per_box;
              const itemBoxPerCtn =
                item.boxPerCtn ||
                (item as any).box_per_ctn ||
                currentProduct?.boxPerCtn ||
                (currentProduct as any)?.box_per_ctn;

              return (
                <div
                  id={`cart-item-${item.id}`}
                  className={`flex flex-col bg-white dark:bg-zinc-900/60 backdrop-blur-md border ${
                    isOutOfStock
                      ? 'border-red-400 dark:border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'border-slate-200 dark:border-zinc-800/50 shadow-sm'
                  } p-3 rounded-sm group gap-2`}
                  key={item.cartId || idx}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold text-xs w-4 shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <FitText
                        as="p"
                        className="font-semibold text-slate-800 dark:text-slate-200 leading-tight"
                        baseSize={13}
                        minSize={9}
                      >
                        {item.name}
                      </FitText>
                      {item.barcode && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{item.barcode}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="w-6 h-6 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-600 dark:text-slate-400 transition-colors shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-y-2 border-t border-slate-100 dark:border-zinc-900 pt-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={item.uom || 'Pcs'}
                        onChange={(e) => updateCartItem(item.cartId, { uom: e.target.value })}
                        className="bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm text-[11px] font-semibold text-slate-600 dark:text-slate-400 focus:outline-none focus:border-slate-400 h-6 px-1 outline-none"
                      >
                        <option value="Pcs">Pcs</option>
                        {itemPcsPerBox && <option value="Box">Box</option>}
                        {itemPcsPerBox && itemBoxPerCtn && <option value="Ctn">Ctn</option>}
                      </select>
                      <div className="flex items-center gap-0.5 shrink-0 bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-zinc-800/50 rounded-sm p-0.5 h-6">
                        <button
                          onClick={() => updateCartItem(item.cartId, { quantity: item.quantity - 1 })}
                          className="w-6 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-800 dark:text-slate-200 rounded-sm transition-colors text-sm leading-none"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '0') updateCartItem(item.cartId, { quantity: 0 });
                            else updateCartItem(item.cartId, { quantity: parseInt(v, 10) || 1 });
                          }}
                          className="w-6 bg-transparent text-center font-semibold text-slate-700 dark:text-slate-300 focus:outline-none text-[12px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => updateCartItem(item.cartId, { quantity: item.quantity + 1 })}
                          className="w-6 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-600 hover:text-slate-800 dark:text-slate-200 rounded-sm transition-colors text-sm leading-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center ml-auto leading-tight">
                      <span className="font-semibold text-slate-900 dark:text-slate-50 text-[13px]">
                        Rs {calculateItemPrice(item).toFixed(2)}
                      </span>
                      {currentProduct?.retail_price != null && (
                        <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Retail: Rs {currentProduct.retail_price}
                        </span>
                      )}
                    </div>
                  </div>

                  {isOutOfStock && (
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-red-100 dark:border-red-900/30">
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center">
                        <AlertTriangle size={12} className="inline mr-1" />
                        Missing {deficit} in stock
                      </span>
                      <button
                        onClick={() => onAddToOurOrder(currentProduct || item, deficit)}
                        className="text-[10px] font-bold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 px-2 py-1 rounded-sm hover:bg-red-200 transition-colors"
                      >
                        Add to Our Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
