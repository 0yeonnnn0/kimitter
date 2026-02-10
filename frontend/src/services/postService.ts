import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Post } from '../types/models';

export const getPosts = (page = 1, limit = 20) =>
  api.get<PaginatedResponse<Post>>('/posts', { params: { page, limit } });

export const getPostById = (postId: number) =>
  api.get<ApiResponse<Post>>(`/posts/${postId}`);

export const createPost = (formData: FormData) =>
  api.post<ApiResponse<Post>>('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updatePost = (postId: number, content: string, tags?: string[]) =>
  api.put<ApiResponse<Post>>(`/posts/${postId}`, {
    content,
    tags: tags ? JSON.stringify(tags) : undefined,
  });

export const deletePost = (postId: number) =>
  api.delete(`/posts/${postId}`);

export const searchPosts = (params: {
  q?: string;
  month?: string;
  mediaType?: string;
  mediaOnly?: string;
  page?: number;
  limit?: number;
}) => api.get<PaginatedResponse<Post>>('/posts/search', { params });
