import React, { useState } from 'react';

export default function CashManagementView() {
  const [float, setFloat] = useState<string>('0.00');
  const [note, setNote] = useState<string>('');

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#151515]">
      <div className="w-full max-w-4xl px-4 md:px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">Cash Management</h1>
        <p className="text-sm text-gray-300 mb-8">
          Set opening cash drawer amount. <a href="#" className="underline">Need help?</a>
        </p>

        <div className="flex flex-col gap-6 max-w-2xl">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm">Opening float</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">Rs</span>
              <input 
                type="number"
                value={float}
                onChange={(e) => setFloat(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#3d3d3d] rounded p-2.5 pl-10 pr-4 text-right focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
             <label className="font-bold text-sm flex gap-1">Note <span className="text-gray-400 font-normal">Optional</span></label>
             <textarea 
                placeholder="Add a note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-32 bg-[#1c1c1c] border border-[#3d3d3d] rounded p-3 focus:outline-none focus:border-blue-500 resize-none"
             />
          </div>

          <div>
             <button className="bg-[#4638c4] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded transition-colors shadow-lg">
                Set float
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
