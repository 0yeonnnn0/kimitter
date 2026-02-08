import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../config/constants';
import * as authService from '../services/authService';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    code: string;
    username: string;
    password: string;
    nickname: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  isLoading: true,

  login: async (username, password) => {
    const { data } = await authService.login(username, password);
    const { user, accessToken, refreshToken } = data.data;
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, accessToken, isLoggedIn: true });
  },

  register: async (data) => {
    const { data: res } = await authService.register(data);
    const { user, accessToken, refreshToken } = res.data;
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
    set({ user, accessToken, isLoggedIn: true });
  },

  logout: async () => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    if (token) {
      try {
        await authService.logout(token);
      } catch {
        /* ignore */
      }
    }
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
    set({ user: null, accessToken: null, isLoggedIn: false });
  },

  restoreSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const userStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      if (token && userStr) {
        const user = JSON.parse(userStr) as User;
        set({ user, accessToken: token, isLoggedIn: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
