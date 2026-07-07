import React from 'react';

export default function QuotesView() {
  return (
    <div className="flex flex-col w-full h-full text-white bg-[#151515] overflow-y-auto">
      <div className="w-full px-8 py-6 max-w-5xl">
        <h1 className="text-3xl font-bold mb-6">Quotes</h1>
        <div className="border-b border-[#2d2d2d] pb-4 mb-8">
           <span className="text-gray-300">View or process quotes. <a href="#" className="underline">Need help?</a></span>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-end mb-10 flex-wrap">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-sm font-bold">Status</label>
            <select className="bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500">
               <option>Open</option>
               <option>Closed</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-64">
             <label className="text-sm font-bold">Customer</label>
             <div className="relative">
               <span className="absolute left-3 top-2.5 text-gray-400 text-xs">👤</span>
               <input type="text" placeholder="Search for customers" className="w-full bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 pl-8 text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
             </div>
          </div>
          <div className="flex flex-col gap-1 w-64">
             <label className="text-sm font-bold">Quote</label>
             <div className="relative">
               <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
               <input type="text" placeholder="Search quote number" className="w-full bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2 pl-8 text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
             </div>
          </div>
          
          <div className="flex gap-4 ml-auto items-center">
            <button className="text-sm text-gray-300 hover:text-white underline">More filters</button>
            <button className="bg-[#4638c4] hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-sm transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Empty State / Table structure */}
        <div className="border border-[#2d2d2d] rounded-lg h-64 flex items-center justify-center text-gray-500 bg-[#1c1c1c]">
           No quotes found matching your criteria.
        </div>
      </div>
    </div>
  );
}
