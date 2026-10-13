import React from 'react';
import type { Product } from '../../types/index';
import FitText from '../FitText';
import { generateSKU } from '../../views/ProductsView';

interface ProductCardProps {
  product: Product;
  onAdd: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onAdd }) => {
  return (
    <div
      onClick={() => onAdd(product)}
      className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 flex flex-col justify-between cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-all active:scale-[0.98] group text-left overflow-hidden w-full min-h-[110px]"
    >
      <div className="w-full min-w-0">
        <FitText
          className="font-semibold text-slate-800 dark:text-slate-200 leading-tight mb-1"
          baseSize={14}
          minSize={9}
        >
          {product.name}
        </FitText>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2 flex items-center gap-1.5 flex-wrap">
          {product.barcode && <span className="break-all">{product.barcode}</span>}
          {product.sku && product.sku !== product.barcode && (
            <>
              {product.barcode && <span className="opacity-40">&bull;</span>}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">{product.sku}</span>
            </>
          )}
          {!product.barcode && !product.sku && <span>{generateSKU(product.name, '')}</span>}
        </p>
      </div>
      <div className="mt-auto w-full flex items-end justify-between pt-2 gap-2 border-t border-slate-100 dark:border-zinc-800/40">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-slate-50 text-[13px] sm:text-[14px] leading-tight shrink-0">
              Rs {product.price.toLocaleString()}
            </span>
            {product.retail_price ? (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap leading-tight">
                Retail: Rs {Number(product.retail_price).toLocaleString()}
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 whitespace-nowrap leading-tight opacity-70">
                Retail: -
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-600 px-2.5 py-1 rounded-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0 text-[11px] active:scale-95 mb-0.5"
        >
          + Add
        </button>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';
