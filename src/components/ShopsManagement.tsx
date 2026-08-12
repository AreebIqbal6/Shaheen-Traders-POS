import React, { useState, useEffect } from 'react';
import { Store, Plus, Save, X, Phone, MapPin, User, Search, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  contactNumber: string;
  address: string;
}

// Map snake_case DB row → camelCase Shop interface
const mapRowToShop = (row: any): Shop => ({
  id: String(row.id),
  name: row.name || '',
  ownerName: row.owner_name || row.ownerName || '',
  contactNumber: row.contact_number || row.contactNumber || '',
  address: row.address || '',
});

// Map camelCase Shop → snake_case DB payload
const mapShopToRow = (shop: Omit<Shop, 'id'> & { id?: string }) => ({
  ...(shop.id ? { id: shop.id } : {}),
  name: shop.name,
  owner_name: shop.ownerName,
  contact_number: shop.contactNumber,
  address: shop.address,
});

export default function ShopsManagement() {
  const [shops, setShops] = useState<Shop[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_shops');
      return saved ? JSON.parse(saved).map(mapRowToShop) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchShops();
    const interval = setInterval(() => {
      try {
        const cached = localStorage.getItem('shaheen_shops');
        if (cached) {
          setShops(JSON.parse(cached).map(mapRowToShop));
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchShops = async () => {
    let fetchedData: Shop[] = [];
    try {
      const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        fetchedData = data.map(mapRowToShop);
      }
    } catch (err) {
      console.warn("Shops fetch from cloud failed, using local.");
    }

    if (fetchedData.length === 0) {
      // Cloud is empty or failed — use cached local data
      try {
        const cached = localStorage.getItem('shaheen_shops');
        if (cached) {
          fetchedData = JSON.parse(cached);
        }
      } catch {}
    } else {
      // Cloud has data — update cache
      localStorage.setItem('shaheen_shops', JSON.stringify(fetchedData));
    }
    setShops(fetchedData);
  };

  const openAddForm = () => {
    setEditingShop(null);
    setName('');
    setOwnerName('');
    setContactNumber('');
    setAddress('');
    setIsAdding(true);
  };

  const openEditForm = (shop: Shop) => {
    setEditingShop(shop);
    setName(shop.name);
    setOwnerName(shop.ownerName || '');
    setContactNumber(shop.contactNumber || '');
    setAddress(shop.address || '');
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingShop(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) {
      toast.error('Shop Name and Address are required');
      return;
    }
    setIsLoading(true);

    try {
      if (editingShop) {
        const updatedShop: Shop = { ...editingShop, name, ownerName, contactNumber, address };
        const updatedShops = shops.map(s => s.id === editingShop.id ? updatedShop : s);
        setShops(updatedShops);
        localStorage.setItem('shaheen_shops', JSON.stringify(updatedShops));
        
        // Send snake_case payload to Supabase
        const { error } = await supabase.from('shops').update(mapShopToRow(updatedShop)).eq('id', editingShop.id);
        if (error) {
          console.error('Failed to update shop in cloud:', error);
          toast.error('Shop updated locally but cloud sync failed. Will retry.');
        } else {
          toast.success('Shop updated successfully');
        }
      } else {
        const newShop: Shop = {
          id: crypto.randomUUID(),
          name,
          ownerName,
          contactNumber,
          address
        };
        const updatedShops = [newShop, ...shops];
        setShops(updatedShops);
        localStorage.setItem('shaheen_shops', JSON.stringify(updatedShops));
        
        // Send snake_case payload to Supabase
        const { error } = await supabase.from('shops').insert([mapShopToRow(newShop)]);
        if (error) {
          console.error('Failed to insert shop in cloud:', error);
          toast.error('Shop saved locally but cloud sync failed. Will retry.');
        } else {
          toast.success('Shop added successfully');
        }
      }
      closeForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save shop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        <span className="font-semibold text-slate-900">Delete this shop?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >Cancel</button>
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              const updatedShops = shops.filter(s => s.id !== id);
              setShops(updatedShops);
              localStorage.setItem('shaheen_shops', JSON.stringify(updatedShops));
              
              try {
                const { error } = await supabase.from('shops').delete().eq('id', id);
                if (error) {
                  console.error('Failed to delete shop from cloud:', error);
                  toast.error('Shop removed locally but cloud sync failed.');
                  return;
                }
              } catch (err) {
                console.error('Shop delete network error:', err);
              }
              toast.success('Shop deleted successfully');
            }}
          >Delete</button>
        </div>
      </span>
    ), { duration: 10000 });
  };

  const filteredShops = shops.filter(s => {
    const safeName = (s.name || '').toLowerCase();
    const safeAddress = (s.address || '').toLowerCase();
    const safeContact = (s.contactNumber || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return safeName.includes(query) || safeAddress.includes(query) || safeContact.includes(query);
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search shops by name, address, phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button
          onClick={isAdding ? closeForm : openAddForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-semibold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'Add Shop'}
        </button>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg shadow-sm p-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6 border-b border-slate-100 dark:border-zinc-800/50 pb-4">
            {editingShop ? `Edit Shop: ${editingShop.name}` : 'Register New Shop'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Store size={12} /> Shop Name *
              </label>
              <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Al-Madina Super Store" />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <User size={12} /> Owner / Contact Person
              </label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="e.g. Haji Sahab" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Phone size={12} /> Contact Number
              </label>
              <input value={contactNumber} onChange={e => setContactNumber(e.target.value)} type="tel" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="0300-1234567" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} /> Area / Address *
              </label>
              <input required value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Complete Shop Address" />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button 
                disabled={isLoading}
                type="submit" 
                className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-8 py-2.5 rounded-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} />
                {isLoading ? 'Saving...' : 'Save Shop'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shops List */}
      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg shadow-sm overflow-hidden">
        {filteredShops.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Store size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No shops found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0a0a0c]/50 border-b border-slate-200 dark:border-zinc-800/50">
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shop Details</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-50">{shop.name}</div>
                      {shop.ownerName && (
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <User size={12} /> {shop.ownerName}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                        {shop.contactNumber ? (
                          <span className="flex items-center gap-1.5"><Phone size={12} /> {shop.contactNumber}</span>
                        ) : (
                          <span className="text-slate-400 italic">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {shop.address || <span className="italic opacity-50">Not provided</span>}
                    </td>
                    <td className="p-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditForm(shop)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                          title="Edit Shop"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(shop.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-sm transition-colors"
                          title="Delete Shop"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
