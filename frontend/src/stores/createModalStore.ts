import { create } from 'zustand';

interface CreateModalState {
  visible: boolean;
  open: () => void;
  close: () => void;
}

export const useCreateModalStore = create<CreateModalState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
