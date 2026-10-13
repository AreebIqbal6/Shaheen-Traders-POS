import React, { useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Search, ScanBarcode } from 'lucide-react';
import type { Product } from '../../types/index';
import FitText from '../../components/FitText';
import { useDebounce } from '../../hooks/useDebounce';

interface PosCatalogGridProps {
  products: Product[];
  addToCart: (product: Product) => void;
  registerItemTypeFilter: 'All' | 'Local' | 'Imported';
  setRegisterItemTypeFilter: (filter: 'All' | 'Local' | 'Imported') => void;
  registerSearchQuery: string;
  setRegisterSearchQuery: (query: string) => void;
  retailPricesDict: Record<string, number>;
  isScannerFocused: boolean;
  onOpenCamera: () => void;
  hiddenScannerRef: React.RefObject<HTMLInputElement | null>;
  handleScan: (val: string) => void;
}

export const PosCatalogGrid: React.FC<PosCatalogGridProps> = ({
  products,
  addToCart,
  registerItemTypeFilter,
  setRegisterItemTypeFilter,
  registerSearchQuery,
  setRegisterSearchQuery,
  retailPricesDict,
  isScannerFocused,
  onOpenCamera,
  hiddenScannerRef,
  handleScan
}) => {
  const debouncedSearchQuery = useDebounce(registerSearchQuery, 150);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (registerItemTypeFilter !== 'All') {
      result = result.filter((p) =>
        registerItemTypeFilter === 'Imported' ? p.item_type === 'Imported' : p.item_type !== 'Imported'
      );
    }
    if (debouncedSearchQuery.trim()) {
      const lowerQ = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (p) => (p.sku || '').toLowerCase() === lowerQ || (p.name || '').toLowerCase().includes(lowerQ)
      );
    }
    return [...result].sort((a, b) => {
      const skuA = parseInt(a.sku || '0', 10) || 0;
      const skuB = parseInt(b.sku || '0', 10) || 0;
      return skuA - skuB;
    });
  }, [products, debouncedSearchQuery, registerItemTypeFilter]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="flex flex-col shrink-0 p-4 md:px-6 md:pt-6 md:pb-2 gap-3 md:gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Register</h1>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4 w-full">
          <div className="flex bg-white dark:bg-zinc-900/60 backdrop-blur-md p-1 rounded-sm border border-slate-200 dark:border-zinc-800/50 shadow-sm shrink-0 gap-1">
            <button
              onClick={() => setRegisterItemTypeFilter('All')}
              className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-all ${
                registerItemTypeFilter === 'All'
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRegisterItemTypeFilter('Local')}
              className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                registerItemTypeFilter === 'Local'
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Local
            </button>
            <button
              onClick={() => setRegisterItemTypeFilter('Imported')}
              className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                registerItemTypeFilter === 'Imported'
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Imported
            </button>
          </div>

          <div className="flex items-center bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm px-4 py-2 w-full lg:max-w-[420px] shadow-sm focus-within:ring-1 ring-slate-400 transition-all">
            <Search size={18} className="text-slate-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder="Search or scan..."
              value={registerSearchQuery}
              onChange={(e) => setRegisterSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                    const product = products.find((p) => p.barcode === val);
                    if (product) {
                      handleScan(val);
                      setRegisterSearchQuery('');
                    } else if (filteredProducts.length === 1) {
                      addToCart(filteredProducts[0]);
                      setRegisterSearchQuery('');
                    }
                  }
                }
              }}
              className="w-full bg-transparent border-none outline-none text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 min-w-0 text-ellipsis"
            />
            <button
              onClick={onOpenCamera}
              className="p-1 rounded-sm focus:outline-none bg-white dark:bg-zinc-900/60 backdrop-blur-md shrink-0"
              title="Open Camera Scanner"
            >
              <ScanBarcode
                size={22}
                className={`${
                  isScannerFocused
                    ? 'text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.5)]'
                    : 'text-red-500'
                } transition-all`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filtered Product Grid (Virtualized) */}
      <div className="flex-1 min-h-0 p-4">
        <VirtuosoGrid
          className="custom-scrollbar"
          style={{ height: '100%', width: '100%' }}
          data={filteredProducts}
          overscan={200}
          listClassName="flex flex-col gap-2.5"
          itemClassName="flex flex-col w-full"
          itemContent={(_index, p) => (
            <button
              onClick={() => {
                addToCart(p);
                if (window.innerWidth > 768) {
                  hiddenScannerRef.current?.focus();
                }
              }}
              className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm p-3 sm:p-3.5 hover:border-slate-400 transition-all text-left w-full flex flex-row items-center justify-between gap-3 shadow-sm overflow-hidden"
            >
              <div className="flex flex-col items-start min-w-0 flex-1">
                <FitText className="font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1" baseSize={14} minSize={9}>
                  {p.name}
                </FitText>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                  <span>{p.barcode}</span>
                  {p.sku && p.sku !== p.barcode && (
                    <>
                      <span className="opacity-40">•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{p.sku}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-4 shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="font-black text-slate-900 dark:text-slate-50 text-[15px] leading-tight">
                    Rs {p.price}
                  </span>
                  {Boolean(p.retail_price) ||
                  (retailPricesDict[p.id] !== undefined && Number(retailPricesDict[p.id]) > 0) ? (
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 whitespace-nowrap leading-tight">
                      Retail: Rs {Number(p.retail_price || retailPricesDict[p.id]).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 whitespace-nowrap leading-tight opacity-70">
                      Retail: -
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-sm shrink-0">
                  Stock: {p.stock}
                </span>
              </div>
            </button>
          )}
        />
      </div>
    </div>
  );
};
