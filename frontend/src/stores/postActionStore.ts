import { create } from 'zustand';
import type { Post } from '../types/models';

interface PostActionState {
  visible: boolean;
  post: Post | null;
  isLiked: boolean;
  isOwner: boolean;
  onLikeToggle: (() => void) | null;
  open: (params: {
    post: Post;
    isLiked: boolean;
    isOwner: boolean;
    onLikeToggle: () => void;
  }) => void;
  close: () => void;
}

export const usePostActionStore = create<PostActionState>((set) => ({
  visible: false,
  post: null,
  isLiked: false,
  isOwner: false,
  onLikeToggle: null,
  open: (params) =>
    set({
      visible: true,
      post: params.post,
      isLiked: params.isLiked,
      isOwner: params.isOwner,
      onLikeToggle: params.onLikeToggle,
    }),
  close: () => set({ visible: false }),
}));
