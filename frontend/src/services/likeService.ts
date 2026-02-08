import api from './api';
import type { ApiResponse } from '../types/api';

export const likePost = (postId: number) =>
  api.post<ApiResponse<{ liked: boolean }>>(`/posts/${postId}/like`);

export const unlikePost = (postId: number) =>
  api.delete<ApiResponse<{ liked: boolean }>>(`/posts/${postId}/like`);

export const getLikedPosts = (page = 1, limit = 20) =>
  api.get<ApiResponse<number[]>>('/likes', { params: { page, limit } });
