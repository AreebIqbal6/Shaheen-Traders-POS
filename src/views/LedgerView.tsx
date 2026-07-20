import type { LedgerPayment } from '../types/index';
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Trash2, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';
import toast from 'react-hot-toast';



interface LedgerViewProps {
  pastOrders: any[];
}

export default function LedgerView({ pastOrders }: LedgerViewProps) {
  const [payments, setPayments] = useState<LedgerPayment[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LedgerPayment>>({ amount: 0, clientName: '', notes: '' });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('shaheen_ledger_payments') || '[]');
    setPayments(saved);
  }, []);

  const handleSave = () => {
    if (!formData.clientName || !formData.amount || formData.amount <= 0) {
      toast.error('Client Name and a valid Amount are required');
      return;
    }
    const newPayment: LedgerPayment = {
      id: Date.now().toString(),
      clientName: formData.clientName,
      amount: formData.amount,
      date: new Date().toISOString(),
      notes: formData.notes || ''
    };
    const updated = [newPayment, ...payments];
    setPayments(updated);
    localStorage.setItem('shaheen_ledger_payments', JSON.stringify(updated));
    setIsModalOpen(false);
    toast.success('Payment recorded');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    const updated = payments.filter(p => p.id !== id);
    setPayments(updated);
    localStorage.setItem('shaheen_ledger_payments', JSON.stringify(updated));
    toast.success('Payment deleted');
  };

  // Group by client
  const clientsMap = new Map<string, { billed: number; paid: number }>();

  // Calculate billed
  pastOrders.forEach(order => {
    if (order.status === 'CANCELLED') return;
    const client = order.clientName || order.client_name || 'Walk-in Customer';
    if (!clientsMap.has(client)) clientsMap.set(client, { billed: 0, paid: 0 });
    clientsMap.get(client)!.billed += (order.total || 0);
  });

  // Calculate paid
  payments.forEach(payment => {
    if (!clientsMap.has(payment.clientName)) clientsMap.set(payment.clientName, { billed: 0, paid: 0 });
    clientsMap.get(payment.clientName)!.paid += payment.amount;
  });

  const clientsList = Array.from(clientsMap.entries()).map(([name, data]) => ({
    name,
    billed: data.billed,
    paid: data.paid,
    balance: data.billed - data.paid
  })).filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const totalReceivables = clientsList.reduce((acc, c) => acc + c.balance, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0a0a0c] overflow-y-auto">
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BookOpen size={28} className="text-blue-600" />
              Ledger / Khata
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage client balances and payments</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <button 
              onClick={() => { setFormData({ amount: 0, clientName: '', notes: '' }); setIsModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0"
            >
              <Plus size={18} />
              Log Payment
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 shrink-0">
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Outstanding</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-50">Rs {totalReceivables.toLocaleString('en-PK')}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm shrink-0 mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/90 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Client Name</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Billed</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Paid</th>
                  <th className="px-6 py-4 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/50">
                {clientsList.length > 0 ? clientsList.map(c => (
                  <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{c.name}</td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Rs {c.billed.toLocaleString('en-PK')}</td>
                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-medium">Rs {c.paid.toLocaleString('en-PK')}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                       <span className={c.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}>
                         Rs {c.balance.toLocaleString('en-PK')}
                       </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No clients found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments Log */}
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 shrink-0">Recent Payments</h2>
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm shrink-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/90 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Notes</th>
                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/50">
                  {payments.slice(0, 50).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(p.date).toLocaleDateString('en-PK')}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{p.clientName}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{p.notes || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">+Rs {p.amount.toLocaleString('en-PK')}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No payments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-zinc-800">
             <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Log Received Payment</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">✕</button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Client Name</label>
                  <input 
                    type="text" 
                    value={formData.clientName}
                    onChange={e => setFormData({...formData, clientName: e.target.value})}
                    placeholder="E.g., Ali Super Store"
                    list="clients-list"
                    className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white text-sm"
                  />
                  <datalist id="clients-list">
                    {Array.from(clientsMap.keys()).map(name => <option key={name} value={name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Amount Received (Rs)</label>
                  <input 
                    type="number" 
                    value={formData.amount || ''}
                    onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 font-mono font-bold text-blue-600 dark:text-blue-400 text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Notes / Reference (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="E.g., Cash, Check #123"
                    className="w-full bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white text-sm"
                  />
                </div>
             </div>
             <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-900/30 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancel</button>
               <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">Save Payment</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
