import api from './api';
import type { ApiResponse } from '../types/api';

export const togglePostLike = (postId: number) =>
  api.post<ApiResponse<{ liked: boolean }>>(`/posts/${postId}/like`);

export const likePost = (postId: number) => togglePostLike(postId);
export const unlikePost = (postId: number) => togglePostLike(postId);

export const getLikedPosts = (page = 1, limit = 20) =>
  api.get<ApiResponse<number[]>>('/likes', { params: { page, limit } });
