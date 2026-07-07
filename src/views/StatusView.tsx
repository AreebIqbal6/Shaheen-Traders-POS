import React from 'react';
import toast from 'react-hot-toast';

export default function StatusView() {
  const handleReset = () => {
    if (confirm("Are you sure you want to wipe local data? This action cannot be undone.")) {
      localStorage.clear();
      toast.success("Local data wiped successfully.");
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#151515]">
      <div className="w-full max-w-4xl px-8 py-6">
        <h1 className="text-3xl font-bold mb-6">Status</h1>

        <div className="mt-8">
           <h2 className="text-lg font-bold mb-2">Reset local data</h2>
           <p className="text-sm text-gray-300 mb-6 max-w-3xl leading-relaxed">
             We keep a copy of some of your store data in your web browser so you can still sell if you lose Internet connection. Sometimes, this gets out of sync. Resetting it can help if you're having trouble with Lightspeed Retail.
           </p>

           <button 
             onClick={handleReset}
             className="bg-[#b32626] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded transition-colors shadow-lg"
           >
             Reset data
           </button>
        </div>
      </div>
    </div>
  );
}
