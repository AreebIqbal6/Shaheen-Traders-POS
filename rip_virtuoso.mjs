import fs from 'fs';
let content = fs.readFileSync('src/views/ProductsView.tsx', 'utf8');

// We need to replace the entire <div className="hidden md:block absolute inset-0">...</div> and <div className="md:hidden ...">...</div> with standard mapping.

const oldDesktopStart = '<TableVirtuoso computeItemKey={(index, item) => item.id || index}';
const newDesktop = `
              <div className="overflow-y-auto custom-scrollbar h-full w-full">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead className="sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold">Barcode</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold">SKU</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold">Product Name</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold">Price</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold">Stock</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold text-right">Total</th>
                      <th className="bg-slate-50 dark:bg-[#0a0a0c] px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => {
                      const mStock = minStockDict[product.id] ?? 5;
                      const isCrit = product.stock <= mStock;
                      const isWarn = product.stock > mStock && product.stock <= mStock + 5;
                      return (
                        <tr key={product.id || index} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-slate-600 dark:text-slate-400">{product.barcode}</td>
                          <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-slate-50">{product.sku || '-'}</td>
                          <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50 whitespace-normal break-words">
                            {product.name}
                          </td>
                          <td className="px-5 py-3 text-slate-900 dark:text-slate-50 font-medium">Rs {product.price.toFixed(2)}</td>
                          <td className="px-5 py-3">
                            <span className={\`px-2 py-0.5 rounded-sm text-[11px] font-bold inline-flex items-center gap-1.5 \${
                              isCrit ? 'bg-[var(--color-crit-dim)] text-red-600 dark:text-red-400 border border-[var(--color-crit)]/30' : 
                              isWarn ? 'bg-[var(--color-warn-dim)] text-amber-600 dark:text-amber-400 border border-[var(--color-warn)]/30' : 
                              'text-slate-600 dark:text-slate-400'
                            }\`}>
                              {isCrit && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-900 dark:text-slate-50 font-bold text-right">Rs {(product.price * product.stock).toFixed(2)}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => handleOpenModal(product)} className="text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white p-1.5 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(product.id)} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:text-red-400 p-1.5 ml-1 transition-colors"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
`;

// Replace the desktop block. We'll find everything between <TableVirtuoso and </TableVirtuoso> (or actually the self-closing tag if it is)
// Wait, TableVirtuoso has a self closing tag!
content = content.replace(/<TableVirtuoso[\s\S]*?\/>/, newDesktop);


const newMobile = `
              <div className="overflow-y-auto custom-scrollbar h-full w-full flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
                {filteredProducts.map((product, index) => {
                  const mStock = minStockDict[product.id] ?? 5;
                  const isCrit = product.stock <= mStock;
                  const isWarn = product.stock > mStock && product.stock <= mStock + 5;
                  return (
                    <div key={product.id || index} className="p-4 flex flex-col gap-2 hover:bg-[rgba(255,255,255,0.03)] transition-colors border-b border-slate-200 dark:border-slate-700">
                       <div className="flex justify-between items-start gap-2">
                           <div className="flex flex-col min-w-0 flex-1">
                             <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight break-words">{product.name}</h3>
                             <div className="flex items-center gap-2 mt-1 truncate">
                               <span className="font-mono text-slate-600 dark:text-slate-400 text-xs truncate">{product.barcode}</span>
                               <span className="font-mono font-bold text-slate-900 dark:text-slate-50 text-[10px] bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 px-1.5 py-0.5 rounded-sm shrink-0">{product.sku || '-'}</span>
                             </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => handleOpenModal(product)} className="text-slate-600 dark:text-slate-400 bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 w-8 h-8 flex items-center justify-center rounded-md"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(product.id)} className="text-red-600 dark:text-red-400 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 w-8 h-8 flex items-center justify-center rounded-md"><Trash2 size={16} /></button>
                          </div>
                       </div>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Rs {product.price.toFixed(2)}</span>
                          <span className={\`px-2 py-0.5 rounded-sm text-[11px] font-bold flex items-center gap-1.5 \${
                            isCrit ? 'bg-[var(--color-crit-dim)] text-red-600 dark:text-red-400 border border-[var(--color-crit)]/30' : 
                            isWarn ? 'bg-[var(--color-warn-dim)] text-amber-600 dark:text-amber-400 border border-[var(--color-warn)]/30' : 
                            'text-slate-600 dark:text-slate-400'
                          }\`}>
                            Stock: {product.stock}
                          </span>
                       </div>
                    </div>
                  );
                })}
              </div>
`;

content = content.replace(/<Virtuoso[\s\S]*?\/>/, newMobile);

fs.writeFileSync('src/views/ProductsView.tsx', content);
