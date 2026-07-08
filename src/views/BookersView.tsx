import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Save, X, Phone, Mail, MapPin, User, Key, Hash, Edit2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { hashPassword } from '../utils/cryptoUtils';

export interface Booker {
  id?: string;
  booker_number: string;
  name: string;
  username: string;
  phone: string;
  email: string;
  address: string;
}

export default function BookersView() {
  const [bookers, setBookers] = useState<Booker[]>(() => {
    const saved = localStorage.getItem('shaheen_bookers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingBooker, setEditingBooker] = useState<Booker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New Booker Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchBookers();
    syncOfflineBookers();

    const handleOnline = () => {
      syncOfflineBookers();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchBookers = async () => {
    let fetchedData: Booker[] = [];
    try {
      const { data, error } = await supabase.from('bookers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) fetchedData = data;
    } catch (err: any) {
      console.error("Fetch bookers error (falling back to local):", err.message);
      const cached = localStorage.getItem('shaheen_bookers');
      if (cached) fetchedData = JSON.parse(cached);
    }

    const offlineStr = localStorage.getItem('shaheen_offline_bookers');
    if (offlineStr) {
      const offlineBookers = JSON.parse(offlineStr);
      const merged = [...fetchedData];
      for (const ob of offlineBookers) {
        if (!merged.some(b => b.booker_number === ob.booker_number)) {
          merged.unshift(ob);
        }
      }
      setBookers(merged);
      localStorage.setItem('shaheen_bookers', JSON.stringify(merged));
    } else {
      setBookers(fetchedData);
      localStorage.setItem('shaheen_bookers', JSON.stringify(fetchedData));
    }
  };

  const syncOfflineBookers = async () => {
    const offlineBookers = JSON.parse(localStorage.getItem('shaheen_offline_bookers') || '[]');
    if (offlineBookers.length === 0 || !navigator.onLine) return;

    const failedBookers: any[] = [];
    for (const bkr of offlineBookers) {
      try {
        const { error } = await supabase.from('bookers').insert([bkr]);
        if (error) {
          failedBookers.push(bkr);
        }
      } catch (err) {
        failedBookers.push(bkr);
      }
    }

    if (failedBookers.length === 0) {
      localStorage.removeItem('shaheen_offline_bookers');
    } else {
      localStorage.setItem('shaheen_offline_bookers', JSON.stringify(failedBookers));
    }
    fetchBookers();
  };

  const openAddForm = () => {
    setEditingBooker(null);
    setName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIsAdding(true);
    setError('');
  };

  const openEditForm = (bkr: Booker) => {
    setEditingBooker(bkr);
    setName(bkr.name);
    setUsername(bkr.username);
    
    // Decode password so admin can view/edit it
    // Passwords are now securely hashed and cannot be reversed or viewed
    setPassword(''); 

    setPhone(bkr.phone || '');
    setEmail(bkr.email || '');
    setAddress(bkr.address || '');
    setIsAdding(true);
    setError('');
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingBooker(null);
  };

  const handleSubmitBooker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || (!password && !editingBooker)) {
      setError("Name, Username, and Password are required.");
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      if (editingBooker) {
        // --- EDIT MODE ---
        const payload: any = { name, username, phone, email, address };
        
        if (password) {
          payload.auth_token = await hashPassword(password);
        }

        const { error } = await supabase.from('bookers').update(payload).eq('id', editingBooker.id);
        if (error) console.warn("Supabase update failed:", error.message);

        const updatedBookers = bookers.map(b => b.id === editingBooker.id ? { ...b, ...payload } : b);
        setBookers(updatedBookers);
        localStorage.setItem('shaheen_bookers', JSON.stringify(updatedBookers));
        toast.success('Booker updated successfully');
      } else {
        // --- ADD MODE ---
        const bookerCount = bookers.length;
        const bookerNumber = `BKR-${String(bookerCount + 1).padStart(3, '0')}`;
        
        const newBooker: Booker = {
          id: crypto.randomUUID(),
          booker_number: bookerNumber,
          name, username, phone, email, address
        };

        const payload = { ...newBooker, auth_token: await hashPassword(password) };
        
        let insertFailed = false;
        try {
          const { error } = await supabase.from('bookers').insert([payload]);
          if (error) {
            insertFailed = true;
            console.warn("Supabase insert failed:", error.message);
          }
        } catch (err) {
          insertFailed = true;
        }

        if (insertFailed) {
          const offlineBookers = JSON.parse(localStorage.getItem('shaheen_offline_bookers') || '[]');
          offlineBookers.push(payload);
          localStorage.setItem('shaheen_offline_bookers', JSON.stringify(offlineBookers));
        }

        const updatedBookers = [payload, ...bookers];
        setBookers(updatedBookers);
        localStorage.setItem('shaheen_bookers', JSON.stringify(updatedBookers));
        toast.success('Booker added successfully');
      }
      
      closeForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save booker.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-[#0a0a0c]/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Bookers Management</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Add and manage field agents.</p>
          </div>
          <button
            onClick={isAdding ? closeForm : openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-sm font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Cancel' : 'Add Booker'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-sm border border-red-200 dark:border-red-800/30 mb-6 flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {isAdding && (
          <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm shadow-sm p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6 border-b border-slate-100 dark:border-zinc-800/50 pb-4">
              {editingBooker ? `Edit Booker: ${editingBooker.name}` : 'Register New Booker'}
            </h3>
            <form onSubmit={handleSubmitBooker} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User size={12} /> Full Name
                </label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. Irfan Ali" />
              </div>
              
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User size={12} /> Username (For Login)
                </label>
                <input required value={username} onChange={e => setUsername(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="e.g. irfan123" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Key size={12} /> {editingBooker ? 'Update Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input required={!editingBooker} value={password} onChange={e => setPassword(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Secure Password" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Phone size={12} /> Phone Number
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="0300-1234567" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Mail size={12} /> Email (Optional)
                </label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="irfan@example.com" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin size={12} /> Residential Address
                </label>
                <input value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Complete Home Address" />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button 
                  disabled={isLoading}
                  type="submit" 
                  className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-8 py-2.5 rounded-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={18} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bookers List */}
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-sm shadow-sm overflow-hidden">
          {bookers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">No bookers registered yet.</p>
              <p className="text-sm mt-1">Click "Add Booker" to get started.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0a0a0c]/50 border-b border-slate-200 dark:border-zinc-800/50">
                      <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booker #</th>
                      <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                      <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                      <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                      <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {bookers.map((bkr, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 align-top">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                            <Hash size={12} /> {bkr.booker_number}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-bold text-slate-900 dark:text-slate-50">{bkr.name}</div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                            <User size={12} /> @{bkr.username}
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                            {bkr.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {bkr.phone}</span>}
                            {bkr.email && <span className="flex items-center gap-1.5"><Mail size={12} /> {bkr.email}</span>}
                            {!bkr.phone && !bkr.email && <span className="text-slate-400 italic">No contact info</span>}
                          </div>
                        </td>
                        <td className="p-4 align-top text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {bkr.address || <span className="italic opacity-50">Not provided</span>}
                        </td>
                        <td className="p-4 align-top text-right">
                          <button 
                            onClick={() => openEditForm(bkr)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-sm transition-colors"
                            title="Edit Booker"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                {bookers.map((bkr, idx) => (
                  <div key={idx} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 dark:text-slate-50 text-sm">{bkr.name}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-mono">
                            <Hash size={10} /> {bkr.booker_number}
                          </span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <User size={10} /> @{bkr.username}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => openEditForm(bkr)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-sm transition-colors shrink-0"
                        title="Edit Booker"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {bkr.phone && <span className="flex items-center gap-1.5"><Phone size={11} /> {bkr.phone}</span>}
                      {bkr.email && <span className="flex items-center gap-1.5"><Mail size={11} /> {bkr.email}</span>}
                      {bkr.address && <span className="flex items-center gap-1.5"><MapPin size={11} /> <span className="truncate">{bkr.address}</span></span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
