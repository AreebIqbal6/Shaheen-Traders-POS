import React from 'react';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import type { OurOrderItem } from '../../views/AdminPOSView';

interface OurOrderViewProps {
  ourOrderList: OurOrderItem[];
  setOurOrderList: React.Dispatch<React.SetStateAction<OurOrderItem[]>>;
}

export default function OurOrderView({ ourOrderList, setOurOrderList }: OurOrderViewProps) {
  return (
    <div className="p-8 flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto">
       <div className="flex justify-between items-center mb-8 shrink-0">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Purchase / Our Order</h1>
         {ourOrderList.length > 0 && (
           <button onClick={() => {
             toast((t) => (
               <span className="flex flex-col gap-2">
                 <span className="font-semibold text-slate-900">Clear the entire list?</span>
                 <div className="flex gap-2 justify-end mt-2">
                   <button 
                     className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
                     onClick={() => toast.dismiss(t.id)}
                   >No</button>
                   <button 
                     className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                     onClick={() => {
                       toast.dismiss(t.id);
                       setOurOrderList([]);
                     }}
                   >Yes, Clear</button>
                 </div>
               </span>
             ), { duration: 5000 });
           }} className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold text-sm hover:bg-red-700 shadow-sm transition-colors">
             Clear List
           </button>
         )}
       </div>
       
       <div className="flex-1 bg-white dark:bg-zinc-900/60 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800/50 overflow-hidden flex flex-col">
         {ourOrderList.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <Package size={48} className="mb-4 opacity-20" />
             <p className="text-lg font-medium">No items needed yet.</p>
           </div>
         ) : (
           <div className="overflow-y-auto overflow-x-auto w-full">
           <table className="w-full text-left border-collapse text-sm">
             <thead>
               <tr className="bg-slate-100 dark:bg-slate-700/50 sticky top-0">
                 <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50">Product Name</th>
                 <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50">Barcode</th>
                 <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50 text-center">Qty Needed</th>
                 <th className="py-3 px-4 font-bold border-b border-slate-200 dark:border-zinc-800/50 text-slate-900 dark:text-slate-50 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {ourOrderList.map(item => (
                 <tr key={item.id} className="border-b border-slate-100 dark:border-zinc-900 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                   <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">{item.name}</td>
                   <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.barcode}</td>
                   <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-bold text-center">{item.quantityNeeded}</td>
                   <td className="py-3 px-4 text-right">
                     <button onClick={() => setOurOrderList(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-sm">
                       Remove
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           </div>
         )}
       </div>
    </div>
  );
}
