import { create } from 'zustand';
import type { User } from '../types/auth.types';
import { getUser, clearAuth } from '../utils/storageUtils';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Clears the persisted tokens as well as the in-memory user. Clearing only
   * memory would let the next `hydrate()` restore the session from SecureStore
   * and silently sign the person back in.
   */
  logout: async () => {
    await clearAuth();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const user = await getUser<User>();
      set({ user, isAuthenticated: !!user });
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
