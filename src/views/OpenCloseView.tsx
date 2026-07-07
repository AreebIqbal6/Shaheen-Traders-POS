import React, { useState } from 'react';

export default function OpenCloseView() {
  const [denominations, setDenominations] = useState({
    r1: 0, r2: 0, r5: 0, r10: 0, r20: 0, r50: 0, r100: 0, r500: 0, r1000: 0, r5000: 0
  });

  const [customAmount, setCustomAmount] = useState(0);
  const [note, setNote] = useState('');

  const calculateTotal = () => {
    return (
      (denominations.r1 * 1) +
      (denominations.r2 * 2) +
      (denominations.r5 * 5) +
      (denominations.r10 * 10) +
      (denominations.r20 * 20) +
      (denominations.r50 * 50) +
      (denominations.r100 * 100) +
      (denominations.r500 * 500) +
      (denominations.r1000 * 1000) +
      (denominations.r5000 * 5000) +
      customAmount
    );
  };

  const handleInputChange = (field: keyof typeof denominations, value: string) => {
    const num = parseInt(value) || 0;
    setDenominations(prev => ({ ...prev, [field]: num }));
  };

  const total = calculateTotal();
  const expectedCash = 4.50; // Mock value
  const difference = total - expectedCash;

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#151515] overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto p-8 flex flex-col gap-8">
        
        {/* Register Details Section */}
        <section className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 border-b border-[#2d2d2d] pb-2">Register details</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Outlet</p>
              <p className="font-medium mt-1">Main Outlet</p>
            </div>
            <div>
              <p className="text-gray-400">Register</p>
              <p className="font-medium mt-1">Main Register</p>
            </div>
            <div>
              <p className="text-gray-400">Closure #</p>
              <p className="font-medium mt-1">2</p>
            </div>
            <div>
              <p className="text-gray-400">Opening time</p>
              <p className="font-medium mt-1">Jun 14, 2026, 11:21 PM</p>
            </div>
          </div>
        </section>

        {/* Count Cash Section */}
        <section className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold">Count cash</h2>
             <span className="text-blue-500 text-sm font-medium cursor-pointer">Clear</span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {/* Column 1 */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Rs 1', key: 'r1', mult: 1 },
                { label: 'Rs 2', key: 'r2', mult: 2 },
                { label: 'Rs 5', key: 'r5', mult: 5 },
                { label: 'Rs 10', key: 'r10', mult: 10 },
                { label: 'Rs 20', key: 'r20', mult: 20 },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-gray-300">{item.label}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={denominations[item.key as keyof typeof denominations] || ''}
                    onChange={(e) => handleInputChange(item.key as keyof typeof denominations, e.target.value)}
                    className="flex-1 bg-[#252525] border border-[#3d3d3d] rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  />
                  <span className="w-16 text-right text-sm">{(denominations[item.key as keyof typeof denominations] * item.mult).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Rs 50', key: 'r50', mult: 50 },
                { label: 'Rs 100', key: 'r100', mult: 100 },
                { label: 'Rs 500', key: 'r500', mult: 500 },
                { label: 'Rs 1000', key: 'r1000', mult: 1000 },
                { label: 'Rs 5000', key: 'r5000', mult: 5000 },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="w-16 text-sm text-gray-300">{item.label}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={denominations[item.key as keyof typeof denominations] || ''}
                    onChange={(e) => handleInputChange(item.key as keyof typeof denominations, e.target.value)}
                    className="flex-1 bg-[#252525] border border-[#3d3d3d] rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  />
                  <span className="w-16 text-right text-sm">{(denominations[item.key as keyof typeof denominations] * item.mult).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-2">
                 <span className="w-16 text-sm text-gray-300">Custom</span>
                 <input 
                    type="number" 
                    min="0"
                    value={customAmount || ''}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-[#252525] border border-[#3d3d3d] rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  />
                  <span className="w-16 text-right text-sm">{customAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2d2d2d] flex justify-between items-center font-bold text-lg">
            <span>CASH TOTAL</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </section>

        {/* Payments Summary Section */}
        <section className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Payments summary</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#2d2d2d] text-gray-400">
              <tr>
                <th className="pb-3 font-medium">Payment type</th>
                <th className="pb-3 font-medium text-right">Expected (Rs)</th>
                <th className="pb-3 font-medium text-right">Counted (Rs)</th>
                <th className="pb-3 font-medium text-right">Differences (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              <tr>
                 <td className="py-4">Cash</td>
                 <td className="py-4 text-right">{expectedCash.toFixed(2)}</td>
                 <td className="py-4 text-right">{total.toFixed(2)}</td>
                 <td className={`py-4 text-right ${difference < 0 ? 'text-red-400' : difference > 0 ? 'text-green-400' : ''}`}>
                   {difference.toFixed(2)}
                 </td>
              </tr>
              <tr>
                 <td className="py-4">Store credit</td>
                 <td className="py-4 text-right">0.00</td>
                 <td className="py-4 text-right">0.00</td>
                 <td className="py-4 text-right">-</td>
              </tr>
              <tr className="font-bold">
                 <td className="py-4">Totals</td>
                 <td className="py-4 text-right">{expectedCash.toFixed(2)}</td>
                 <td className="py-4 text-right">{total.toFixed(2)}</td>
                 <td className={`py-4 text-right ${difference < 0 ? 'text-red-400' : difference > 0 ? 'text-green-400' : ''}`}>
                   {difference.toFixed(2)}
                 </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Closing Summary */}
        <section className="flex flex-col gap-4">
           <div className="flex justify-between items-start">
             <h2 className="text-xl font-bold w-1/3">Closing summary</h2>
             <div className="w-2/3 flex flex-col gap-2">
                <label className="font-bold text-sm">Note</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Type to add a register closure note"
                  className="w-full h-32 bg-[#252525] border border-[#3d3d3d] rounded p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
             </div>
           </div>
           <div className="flex justify-end mt-4">
             <button className="bg-[#4638c4] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded text-lg transition-colors shadow-lg">
                Close register
             </button>
           </div>
        </section>

      </div>
    </div>
  );
}
