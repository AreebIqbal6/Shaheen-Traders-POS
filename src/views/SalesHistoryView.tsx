import React from 'react';
import { Download } from 'lucide-react';

export default function SalesHistoryView() {
  return (
    <div className="flex flex-col w-full h-full text-white bg-[#151515] overflow-y-auto">
      <div className="w-full px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">Sales history</h1>
        
        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#2d2d2d] mb-6">
          <button className="pb-2 border-b-2 border-blue-500 font-bold text-white">All</button>
          <button className="pb-2 text-gray-400 hover:text-white font-medium">Process return</button>
          <button className="pb-2 text-gray-400 hover:text-white font-medium">Continue sale</button>
        </div>

        <p className="text-sm text-gray-300 mb-8">
          View, edit and manage your sales all in one place. <a href="#" className="underline">Need help?</a>
        </p>

        {/* Filters */}
        <div className="flex gap-4 items-end mb-10 flex-wrap">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-sm font-bold">Date</label>
            <select className="bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
               <option>Choose date range...</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-48">
             <label className="text-sm font-bold">Time range</label>
             <input type="text" placeholder="Choose a time range" className="bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1 w-48">
             <label className="text-sm font-bold">Customer</label>
             <input type="text" placeholder="Enter a customer" className="bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-1 w-48">
             <label className="text-sm font-bold">Receipt or note</label>
             <input type="text" placeholder="Enter a receipt or note" className="bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-3 ml-auto items-center">
            <button className="text-sm text-gray-300 hover:text-white underline">Clear filters</button>
            <button className="text-sm text-gray-300 hover:text-white underline">More filters</button>
            <button className="bg-[#4638c4] hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-sm transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* List Section */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <span className="text-sm text-gray-400">Displaying 1 sale</span>
             <button className="flex items-center gap-2 text-sm font-bold hover:text-gray-300">
               <Download size={16} /> Export list
             </button>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm border-t border-b border-[#2d2d2d]">
                <thead className="bg-[#1c1c1c]">
                  <tr>
                    <th className="py-4 px-2 w-8"></th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Receipt</th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Customer</th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Sold by</th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Note</th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Sale total</th>
                    <th className="py-4 font-medium border-b-2 border-transparent">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2d2d2d]">
                  <tr className="hover:bg-[#1c1c1c] cursor-pointer transition-colors">
                     <td className="py-4 px-2 text-gray-500">{'>'}</td>
                     <td className="py-4">
                       <p className="font-bold">1</p>
                       <p className="text-xs text-gray-400 mt-1">Jun 14, 2026,<br/>11:26 PM</p>
                     </td>
                     <td className="py-4">-</td>
                     <td className="py-4 flex items-center gap-2">
                       <div className="w-8 h-8 rounded bg-yellow-600 text-white flex items-center justify-center font-bold">AI</div>
                       <div>
                         <p className="font-bold">Areeb Iqbal</p>
                         <p className="text-xs text-gray-400">Main Outlet</p>
                       </div>
                     </td>
                     <td className="py-4">-</td>
                     <td className="py-4 font-medium">Rs 5</td>
                     <td className="py-4">Completed</td>
                  </tr>
                </tbody>
             </table>
          </div>
          
          <div className="h-2 w-full bg-[#252525] rounded-full mt-4">
            <div className="h-full bg-gray-500 rounded-full w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
