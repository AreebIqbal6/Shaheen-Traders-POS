import React, { useState, useEffect } from 'react';
import { MapPin, Plus, X, Trash2, Save, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { safeSupabaseInsert } from '../utils/safeSync';

interface Area {
  id: string;
  name: string;
}

export default function AreasManagement() {
  const [areas, setAreas] = useState<Area[]>(() => {
    try {
      const saved = localStorage.getItem('shaheen_areas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase.from('areas').select('*').order('name', { ascending: true });
      if (!error && data) {
        setAreas(data);
        localStorage.setItem('shaheen_areas', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Areas fetch failed, using local cache.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) {
      toast.error('Area name is required');
      return;
    }

    // Check for duplicates
    if (areas.some(a => a.name.toLowerCase() === newAreaName.trim().toLowerCase())) {
      toast.error('This area already exists');
      return;
    }

    setIsLoading(true);
    try {
      const newArea: Area = {
        id: crypto.randomUUID(),
        name: newAreaName.trim(),
      };
      const updatedAreas = [...areas, newArea].sort((a, b) => a.name.localeCompare(b.name));
      setAreas(updatedAreas);
      localStorage.setItem('shaheen_areas', JSON.stringify(updatedAreas));

      const { error } = await safeSupabaseInsert('areas', { id: newArea.id, name: newArea.name });
      if (error) {
        console.error('Failed to insert area in cloud:', error);
        toast.error('Area saved locally but cloud sync failed.');
      } else {
        toast.success('Area added successfully');
      }
      setNewAreaName('');
      setIsAdding(false);
    } catch (err) {
      toast.error('Failed to add area');
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    toast((t) => (
      <span className="flex flex-col gap-2">
        <span className="font-semibold text-slate-900">Delete this area?</span>
        <div className="flex gap-2 justify-end mt-2">
          <button 
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold transition-colors" 
            onClick={() => toast.dismiss(t.id)}
          >Cancel</button>
          <button 
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors" 
            onClick={async () => {
              toast.dismiss(t.id);
              const updated = areas.filter(a => a.id !== id);
              setAreas(updated);
              localStorage.setItem('shaheen_areas', JSON.stringify(updated));
              try {
                await supabase.from('areas').delete().eq('id', id);
                toast.success('Area deleted');
              } catch {
                toast.error('Cloud delete failed');
              }
            }}
          >Delete</button>
        </div>
      </span>
    ));
  };

  const filteredAreas = areas.filter(a => 
    (a.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setNewAreaName(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-semibold transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          {isAdding ? 'Cancel' : 'Add Area'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg shadow-sm p-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 border-b border-slate-100 dark:border-zinc-800/50 pb-3">
            Add New Area
          </h3>
          <form onSubmit={handleAdd} className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} /> Area Name *
              </label>
              <input 
                required 
                autoFocus
                value={newAreaName} 
                onChange={e => setNewAreaName(e.target.value)} 
                type="text" 
                className="w-full bg-slate-50 dark:bg-[#0a0a0c]/50 border border-slate-200 dark:border-zinc-800/50 rounded-sm py-2 px-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" 
                placeholder="e.g. Liaquatabad, Garden, Nazimabad..." 
              />
            </div>
            <div className="flex items-end">
              <button 
                disabled={isLoading}
                type="submit" 
                className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 py-2.5 rounded-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={18} />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200 dark:border-zinc-800/50 rounded-lg shadow-sm overflow-hidden">
        {filteredAreas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No areas found. Add your first area above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{area.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(area.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                  title="Delete Area"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
