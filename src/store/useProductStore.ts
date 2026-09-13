import { create } from 'zustand';

interface ProductState {
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  searchQuery: '',
  selectedCategory: 'All',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));
