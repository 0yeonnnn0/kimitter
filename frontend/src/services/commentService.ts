import api from './api';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type { Comment } from '../types/models';

export const getComments = (postId: number, page = 1, limit = 50) =>
  api.get<PaginatedResponse<Comment>>(`/comments/post/${postId}`, { params: { page, limit } });

export const createComment = (postId: number, content: string) =>
  api.post<ApiResponse<Comment>>(`/comments/post/${postId}`, { content });

export const createReply = (commentId: number, content: string) =>
  api.post<ApiResponse<Comment>>(`/comments/${commentId}/replies`, { content });

export const updateComment = (commentId: number, content: string) =>
  api.put<ApiResponse<Comment>>(`/comments/${commentId}`, { content });

export const deleteComment = (commentId: number) =>
  api.delete(`/comments/${commentId}`);
