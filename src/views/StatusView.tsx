import React from 'react';
import toast from 'react-hot-toast';

export default function StatusView() {
  const handleReset = () => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1e1e1e] shadow-lg rounded-lg pointer-events-auto flex flex-col ring-1 ring-black ring-opacity-5 p-5`}>
        <div className="flex-1 pt-0.5">
          <p className="text-[15px] font-bold text-white mb-1">
            Wipe Local Data
          </p>
          <p className="text-[13px] text-gray-300">
            Are you sure you want to wipe local data? This action cannot be undone.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              localStorage.clear();
              toast.success("Local data wiped successfully.");
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-[13px] font-semibold shadow-sm transition-colors"
          >
            Reset data
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: 'top-center' });
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
