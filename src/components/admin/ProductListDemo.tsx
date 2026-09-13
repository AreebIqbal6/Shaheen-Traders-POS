import React from 'react';
import { useProductsQuery } from '../../queries/useProductsQuery';
import { useProductStore } from '../../store/useProductStore';

export default function ProductListDemo() {
  const { data: products, isLoading, error } = useProductsQuery();
  const { searchQuery, setSearchQuery } = useProductStore();

  if (isLoading) return <div>Loading products via React Query...</div>;
  if (error) return <div>Error loading products: {(error as Error).message}</div>;

  const filtered = products?.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-4 border rounded-md shadow-sm bg-white dark:bg-zinc-900">
      <h3 className="font-bold text-lg mb-2">Zustand + React Query Demo</h3>
      <input 
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {filtered?.slice(0, 10).map(p => (
          <div key={p.id} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded">
            {p.name} - Rs {p.price}
          </div>
        ))}
      </div>
    </div>
  );
}
