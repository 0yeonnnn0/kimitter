import { create } from 'zustand';

interface ErrorState {
  message: string;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  message: '',
  visible: false,
  show: (message: string) => set({ message, visible: true }),
  hide: () => set({ visible: false }),
}));
