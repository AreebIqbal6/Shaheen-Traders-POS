import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'booker';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  bookerName: string | null;
  setAuth: (isAuthenticated: boolean, role?: Role, bookerName?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      bookerName: null,
      
      setAuth: (isAuthenticated, role = 'admin', bookerName = null) => 
        set({ isAuthenticated, role, bookerName: bookerName || null }),
        
      logout: () => set({ isAuthenticated: false, role: null, bookerName: null })
    }),
    {
      name: 'pos-auth-storage',
    }
  )
);
