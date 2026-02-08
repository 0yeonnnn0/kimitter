import { create } from 'zustand';
import * as postService from '../services/postService';
import * as likeService from '../services/likeService';
import type { Post } from '../types/models';
import type { Pagination } from '../types/api';

interface FeedState {
  posts: Post[];
  pagination: Pagination | null;
  isLoading: boolean;
  isRefreshing: boolean;
  fetchPosts: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (post: Post) => void;
  removePost: (postId: number) => void;
  toggleLike: (postId: number, liked: boolean) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  pagination: null,
  isLoading: false,
  isRefreshing: false,

  fetchPosts: async (refresh = false) => {
    if (refresh) {
      set({ isRefreshing: true });
    } else {
      set({ isLoading: true });
    }
    try {
      const { data } = await postService.getPosts(1);
      set({ posts: data.data, pagination: data.pagination });
    } finally {
      set({ isLoading: false, isRefreshing: false });
    }
  },

  loadMore: async () => {
    const { pagination, posts, isLoading } = get();
    if (isLoading || !pagination || pagination.page >= pagination.totalPages) return;
    set({ isLoading: true });
    try {
      const { data } = await postService.getPosts(pagination.page + 1);
      set({ posts: [...posts, ...data.data], pagination: data.pagination });
    } finally {
      set({ isLoading: false });
    }
  },

  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  updatePost: (post) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === post.id ? post : p)),
    })),

  removePost: (postId) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),

  toggleLike: async (postId, liked) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, _count: { ...p._count, likes: p._count.likes + (liked ? 1 : -1) } }
          : p,
      ),
    }));
    try {
      if (liked) {
        await likeService.likePost(postId);
      } else {
        await likeService.unlikePost(postId);
      }
    } catch {
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: p._count.likes + (liked ? -1 : 1) } }
            : p,
        ),
      }));
    }
  },
}));
